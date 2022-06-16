import {
	BaseWalletAdapter,
	ContractReadInvocation,
	ContractReadInvocationMulti,
	ContractReadInvocationResult,
	ContractWriteInvocation,
	ContractWriteInvocationMulti,
	ContractWriteInvocationResult,
	GetNetworksInvocationResult,
	pollUntilReady,
	SignMessageInvocation,
	SignMessageInvocationResult,
	WalletAccountError,
	WalletConnectionError,
	WalletDisconnectionError,
	WalletError,
	WalletNotConnectedError,
} from '@rentfuse-labs/neo-wallet-adapter-base';
import {
	NeoLineAccount,
	NeoLineInit,
	NeoLineInterface,
	NeoLineN3Init,
	NeoLineN3Interface,
	NeoLineNetworks,
	NeoLineReadInvocationResult,
	NeoLineSignMessageInvocationResult,
	NeoLineWriteInvocationResult,
} from './utils/neoline';

const DEFAULT_WALLET_CONFIG = { options: null };

// The configuration object used to create an instance of the wallet
export interface NeoLineWalletAdapterConfig {
	options: any;
	pollInterval?: number;
	pollCount?: number;
}

// Reference at https://neoline.io/dapi/N3.html (Taken on 08/11/21)
export class NeoLineWalletAdapter extends BaseWalletAdapter {
	private _address: string | null;
	private _connecting: boolean;

	// TODO: What?
	private _options: any;

	private _client: NeoLineN3Interface | undefined;
	private _clientCommon: NeoLineInterface | undefined;

	constructor(config: NeoLineWalletAdapterConfig = DEFAULT_WALLET_CONFIG) {
		super();

		this._address = null;
		this._connecting = false;
		this._options = config.options;

		if (!this.ready) pollUntilReady(this, config.pollInterval || 1000, config.pollCount || 3);
	}

	get address(): string | null {
		return this._address;
	}

	get ready(): boolean {
		return typeof window !== 'undefined' && (window as any).NEOLineN3 !== 'undefined';
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

			try {
				// Get the neoline client initializing the wallet
				this._client = await NeoLineN3Init();
				this._clientCommon = await NeoLineInit();
			} catch (error: any) {
				if (error instanceof WalletError) throw error;
				throw new WalletConnectionError(error?.message, error);
			}

			if (!this._client || !this._clientCommon) throw new WalletAccountError();

			let account: NeoLineAccount;
			try {
				// NeoLine asks the user to connect the dapp when calling the getAccount method
				account = await this._client.getAccount();
			} catch (error: any) {
				throw new WalletAccountError(error?.message, error);
			}

			if (!account) throw new WalletAccountError();
			this._address = account.address;

			// Add a listener to cleanup on changes condition
			window.addEventListener('NEOLine.NEO.EVENT.DISCONNECTED', this._disconnected);
			window.addEventListener('NEOLine.NEO.EVENT.ACCOUNT_CHANGED', this._disconnected);
			window.addEventListener('NEOLine.NEO.EVENT.NETWORK_CHANGED', this._disconnected);

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
		if (client) {
			try {
				// TODO: How?
				//await this._client.disconnect();

				window.removeEventListener('NEOLine.NEO.EVENT.DISCONNECTED', this._disconnected);
				window.removeEventListener('NEOLine.NEO.EVENT.ACCOUNT_CHANGED', this._disconnected);
				window.removeEventListener('NEOLine.NEO.EVENT.NETWORK_CHANGED', this._disconnected);

				this._address = null;
				this._client = undefined;
				this._clientCommon = undefined;
			} catch (error: any) {
				this.emit('error', new WalletDisconnectionError(error?.message, error));
			}
		}
		this.emit('disconnect');
	}

	async invokeRead(request: ContractReadInvocation): Promise<ContractReadInvocationResult> {
		const client = this._client;
		if (!client) throw new WalletNotConnectedError();

		try {
			const response = await client.invokeRead({
				scriptHash: request.scriptHash,
				operation: request.operation,
				args: request.args,
				signers: request.signers as any,
			});
			return this._responseToReadResult(response);
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		}
	}

	async invokeReadMulti(request: ContractReadInvocationMulti): Promise<ContractReadInvocationResult> {
		const client = this._client;
		if (!client) throw new WalletNotConnectedError();

		try {
			const response = await client.invokeReadMulti({
				invokeReadArgs: request.invocations,
				signers: request.signers as any,
			});
			return this._responseToReadResult(response);
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		}
	}

	async invoke(request: ContractWriteInvocation): Promise<ContractWriteInvocationResult> {
		const client = this._client;
		if (!client) throw new WalletNotConnectedError();

		try {
			const response = await client.invoke({
				scriptHash: request.scriptHash,
				operation: request.operation,
				args: request.args,
				signers: request.signers as any,
				fee: request.fee,
				extraSystemFee: request.extraSystemFee,
				broadcastOverride: request.broadcastOverride,
			});
			return this._responseToWriteResult(response);
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		}
	}

	async invokeMulti(request: ContractWriteInvocationMulti): Promise<ContractWriteInvocationResult> {
		const client = this._client;
		if (!client) throw new WalletNotConnectedError();

		try {
			const response = await client.invokeMultiple({
				invokeArgs: request.invocations,
				signers: request.signers as any,
				fee: request.fee,
				extraSystemFee: request.extraSystemFee,
				broadcastOverride: request.broadcastOverride,
			});
			return this._responseToWriteResult(response);
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		}
	}

	async getNetworks(): Promise<GetNetworksInvocationResult> {
		const clientCommon = this._clientCommon;
		if (!clientCommon) throw new WalletNotConnectedError();

		try {
			const response = await clientCommon.getNetworks();
			return this._responseToGetNetworksResult(response);
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		}
	}

	async signMessage(request: SignMessageInvocation): Promise<SignMessageInvocationResult> {
		const client = this._client;
		if (!client) throw new WalletNotConnectedError();

		try {
			const response = await client.signMessage({
				message: request.message,
			});
			return this._responseToSignMessageResult(response);
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		}
	}

	private _responseToReadResult(response: NeoLineReadInvocationResult): ContractReadInvocationResult {
		// If the state is halt it means that everything went well
		if (response.state === 'HALT') {
			return {
				status: 'success',
				data: {
					script: response.script,
					state: response.state,
					gasConsumed: response.gas_consumed,
					exception: null,
					stack: response.stack,
				},
			};
		}

		// Otherwise an error occurred and so return it
		// TODO: message and code where?
		return {
			status: 'error',
			message: undefined,
			code: undefined,
		};
	}

	private _responseToWriteResult(response: NeoLineWriteInvocationResult): ContractWriteInvocationResult {
		return {
			status: 'success',
			data: {
				txId: response.txid,
			},
		};
	}

	private _responseToGetNetworksResult(response: NeoLineNetworks): GetNetworksInvocationResult {
		return {
			status: 'success',
			data: {
				networks: response.networks,
				defaultNetwork: response.defaultNetwork,
			},
		};
	}

	private _responseToSignMessageResult(response: NeoLineSignMessageInvocationResult): SignMessageInvocationResult {
		return {
			status: 'success',
			data: {
				publicKey: response.publicKey,
				data: response.data,
				salt: response.salt,
				message: response.message,
			},
		};
	}

	// Arrow function to bind this correctly in event listener
	private _disconnected = () => {
		this.disconnect();
	};
}
