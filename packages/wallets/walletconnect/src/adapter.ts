import {
	BaseWalletAdapter,
	WalletError,
	WalletConnectionError,
	WalletAccountError,
	WalletDisconnectionError,
	WalletDisconnectedError,
	ContractReadInvocation,
	ContractReadInvocationMulti,
	ContractWriteInvocation,
	ContractWriteInvocationMulti,
	ContractReadInvocationResult,
	ContractWriteInvocationResult,
	WalletNotConnectedError,
	WalletWindowClosedError,
} from '@rentfuse-labs/neo-wallet-adapter-base';
import Client, { CLIENT_EVENTS } from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';
import { SessionTypes, PairingTypes, AppMetadata } from '@walletconnect/types';
import { ERROR } from '@walletconnect/utils';
import { RequestArguments } from '@walletconnect/jsonrpc-utils';

interface WcConnectOptions {
	chainId: string;
	topic?: string;
	chains?: string[];
	appMetadata: AppMetadata;
	methods: string[];
}

interface RpcCallResult {
	method: string;
	result: any;
}

// The configuration object used to create an instance of the wallet
export interface WalletConnectWalletAdapterConfig {
	options: WcConnectOptions;
	logger: string;
	relayProvider: string;
}

// The main class for the wallet
// Inspired from the beautiful work of https://github.com/CityOfZion/wallet-connect-client <3
export class WalletConnectWalletAdapter extends BaseWalletAdapter {
	private _address: string | null;
	private _connecting: boolean;

	private _options: WcConnectOptions;
	private _logger: string;
	private _relayProvider: string;

	private _client: Client | undefined;
	private _session: SessionTypes.Created | undefined;

	constructor(config: WalletConnectWalletAdapterConfig) {
		super();

		this._address = null;
		this._connecting = false;
		this._options = config.options;
		this._logger = config.logger;
		this._relayProvider = config.relayProvider;
	}

	get address(): string | null {
		return this._address;
	}

	get ready(): boolean {
		return typeof window !== 'undefined';
	}

	get connecting(): boolean {
		return this._connecting;
	}

	get connected(): boolean {
		return !!this._address;
	}

	async connect(): Promise<void> {
		try {
			if (this.connected || this.connecting) return;
			this._connecting = true;

			let client: Client;
			let session: SessionTypes.Settled;
			try {
				client = await Client.init({
					logger: this._logger,
					relayProvider: this._relayProvider,
				});

				// eslint-disable-next-line no-async-promise-executor
				session = await new Promise<SessionTypes.Settled>(async (resolve, reject) => {
					let session: SessionTypes.Settled;

					async function onPairingProposal(proposal: PairingTypes.Proposal) {
						const { uri } = proposal.signal.params;
						QRCodeModal.open(uri, () => {
							cleanup();
							reject(new WalletWindowClosedError());
						});
					}

					async function onPairingCreated(created: PairingTypes.Created) {
						cleanup();
						resolve(session);
					}

					function cleanup() {
						client.off(CLIENT_EVENTS.pairing.proposal, onPairingProposal);
						client.off(CLIENT_EVENTS.pairing.created, onPairingCreated);
					}

					try {
						client.on(CLIENT_EVENTS.pairing.proposal, onPairingProposal);
						client.on(CLIENT_EVENTS.pairing.created, onPairingCreated);

						// Connect and obtain the session
						session = await client.connect({
							metadata: this._options.appMetadata,
							pairing: this._options.topic ? { topic: this._options.topic } : undefined,
							permissions: {
								blockchain: {
									chains: this._options.chains ?? (this._options.chainId ? [this._options.chainId] : []),
								},
								jsonrpc: {
									methods: this._options.methods,
								},
							},
						});
					} catch (error: any) {
						cleanup();
						reject(error);
					}
				});
			} catch (error: any) {
				if (error instanceof WalletError) throw error;
				throw new WalletConnectionError(error?.message, error);
			}

			if (!session.state.accounts.length) throw new WalletAccountError();

			// Get info and take account address
			const info = session.state.accounts[0].split(':');
			if (!info || info.length < 3) throw new WalletAccountError();
			const address = info[2];

			client.on(CLIENT_EVENTS.session.deleted, this._disconnected);

			this._address = address;
			this._client = client;
			this._session = session;

			this.emit('connect');
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		} finally {
			this._connecting = false;
		}
	}

	async disconnect(): Promise<void> {
		const client = this._client;
		const session = this._session;

		if (client && session) {
			this._address = null;
			this._client = undefined;

			try {
				await client.disconnect({
					topic: session.topic,
					reason: ERROR.USER_DISCONNECTED.format(),
				});
			} catch (error: any) {
				this.emit('error', new WalletDisconnectionError(error?.message, error));
			}
		}

		this.emit('disconnect');
	}

	async invokeRead(request: ContractReadInvocation): Promise<ContractReadInvocationResult> {
		const client = this._client;
		const session = this._session;
		if (!client || !session) throw new WalletNotConnectedError();

		try {
			const response = await this._sendRequest(client, session, this._options.chainId, {
				method: 'testInvoke',
				params: [
					{
						scriptHash: request.scriptHash,
						operation: request.operation,
						args: request.args,
						abortOnFail: request.abortOnFail,
						signer: request.signers?.[0],
					},
				],
			});

			return this._responseToReadResult(response);
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		}
	}

	async invokeReadMulti(request: ContractReadInvocationMulti): Promise<ContractReadInvocationResult> {
		const client = this._client;
		const session = this._session;
		if (!client || !session) throw new WalletNotConnectedError();

		try {
			const response = await this._sendRequest(client, session, this._options.chainId, {
				method: 'multiTestInvoke',
				params: [
					{
						invocations: request.invocations,
						signer: request.signers,
					},
				],
			});

			return this._responseToReadResult(response);
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		}
	}

	async invoke(request: ContractWriteInvocation): Promise<ContractWriteInvocationResult> {
		const client = this._client;
		const session = this._session;
		if (!client || !session) throw new WalletNotConnectedError();

		try {
			const response = await this._sendRequest(client, session, this._options.chainId, {
				method: 'invokefunction',
				params: [
					{
						scriptHash: request.scriptHash,
						operation: request.operation,
						args: request.args,
						abortOnFail: request.abortOnFail,
						signer: request.signers?.[0],
					},
				],
			});

			return this._responseToWriteResult(response);
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		}
	}

	async invokeMulti(request: ContractWriteInvocationMulti): Promise<ContractWriteInvocationResult> {
		const client = this._client;
		const session = this._session;
		if (!client || !session) throw new WalletNotConnectedError();

		try {
			const response = await this._sendRequest(client, session, this._options.chainId, {
				method: 'multiInvoke',
				params: [
					{
						signer: request.signers,
						invocations: request.invocations,
					},
				],
			});

			return this._responseToWriteResult(response);
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		}
	}

	private async _sendRequest(
		client: Client,
		session: SessionTypes.Created,
		chainId: string,
		request: RequestArguments,
	): Promise<RpcCallResult> {
		try {
			const result = await client.request({
				topic: session.topic,
				chainId,
				request,
			});

			return {
				method: request.method,
				result,
			};
		} catch (error) {
			return {
				method: request.method,
				result: { error },
			};
		}
	}

	private _responseToReadResult(response: RpcCallResult): ContractReadInvocationResult {
		// If the state is halt it means that everything went well
		if (response.result.state === 'HALT') {
			return {
				status: 'success',
				data: {
					...response.result,
				},
			};
		}

		// Otherwise an error occurred and so return it
		return {
			status: 'error',
			message: response.result.error?.message,
			code: response.result.error?.code,
		};
	}

	private _responseToWriteResult(response: RpcCallResult): ContractWriteInvocationResult {
		// If the state is halt it means that everything went well
		if (response.result.state === 'HALT') {
			return {
				status: 'success',
				data: {
					...response.result,
				},
			};
		}

		// Otherwise an error occurred and so return it
		return {
			status: 'error',
			message: response.result.error?.message,
			code: response.result.error?.code,
		};
	}

	private _disconnected() {
		const client = this._client;
		if (client) {
			client.off(CLIENT_EVENTS.session.deleted, this._disconnected);

			this._address = null;
			this._client = undefined;
			this._session = undefined;

			this.emit('error', new WalletDisconnectedError());
			this.emit('disconnect');
		}
	}
}
