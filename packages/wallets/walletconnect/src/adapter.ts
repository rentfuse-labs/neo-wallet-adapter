import { RpcCallResult, SignedMessage, WcConnectOptions, WcSdk } from '@cityofzion/wallet-connect-sdk-core';
import {
	BaseWalletAdapter,
	ContractReadInvocation,
	ContractReadInvocationMulti,
	ContractReadInvocationResult,
	ContractWriteInvocation,
	ContractWriteInvocationMulti,
	ContractWriteInvocationResult,
	SignMessageInvocation,
	SignMessageInvocationResult,
	WalletAccountError,
	WalletConnectionError,
	WalletDisconnectedError,
	WalletDisconnectionError,
	WalletError,
	WalletNotConnectedError,
} from '@rentfuse-labs/neo-wallet-adapter-base';
import QRCodeModal from '@walletconnect/qrcode-modal';

// The configuration object used to create an instance of the wallet
export interface WalletConnectWalletAdapterConfig {
	options: WcConnectOptions;
	logger: string;
	relayProvider: string;
}

export class WalletConnectWalletAdapter extends BaseWalletAdapter {
	private _address: string | null;
	private _connecting: boolean;

	private _options: WcConnectOptions;
	private _logger: string;
	private _relayProvider: string;

	private _walletConnectInstance: WcSdk | undefined;

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

			let walletConnectInstance: WcSdk;
			try {
				// Create walletconnect coz instance
				walletConnectInstance = new WcSdk();
				// Initialize it
				await walletConnectInstance.initClient(this._logger, this._relayProvider);

				// Subscribe to wc events
				walletConnectInstance.subscribeToEvents({
					onProposal: (uri: string) => {
						// show the QRCode, you can use @walletconnect/qrcode-modal to do so, but any QRCode presentation is fine
						QRCodeModal.open(uri, () => {
							// Eheh just show that!
						});
						// alternatively you can show Neon Wallet Connect's website, which is more welcoming
						//window.open(`https://neon.coz.io/connect?uri=${uri}`, '_blank').focus();
					},
					onDeleted: () => {
						// here is where you describe a logout callback
						this._disconnected();
					},
				});

				// Load any existing connection, it should be called after the initialization, to reestablish connections made previously
				await walletConnectInstance.loadSession();
				// If the session has not been loaded try to load it
				if (!walletConnectInstance.session) {
					// If we're here we need to connect
					await walletConnectInstance.connect(this._options);
					// the promise will be resolved after the connection is accepted or refused, you can close the QRCode modal here
					QRCodeModal.close();
				}
			} catch (error: any) {
				if (error instanceof WalletError) throw error;
				throw new WalletConnectionError(error?.message, error);
			}

			if (!walletConnectInstance.session) throw new WalletAccountError();

			this._address = walletConnectInstance.accountAddress;
			this._walletConnectInstance = walletConnectInstance;

			this.emit('connect');
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		} finally {
			this._connecting = false;
		}
	}

	async disconnect(): Promise<void> {
		const walletConnectInstance = this._walletConnectInstance;

		if (walletConnectInstance && walletConnectInstance.session) {
			try {
				await walletConnectInstance.disconnect();
			} catch (error: any) {
				this.emit('error', new WalletDisconnectionError(error?.message, error));
			} finally {
				this._address = null;
				this._walletConnectInstance = undefined;
			}
		}

		this.emit('disconnect');
	}

	async invokeRead(request: ContractReadInvocation): Promise<ContractReadInvocationResult> {
		const walletConnectInstance = this._walletConnectInstance;
		if (!walletConnectInstance || !walletConnectInstance.session) throw new WalletNotConnectedError();

		try {
			const response = await walletConnectInstance.testInvoke(
				{
					scriptHash: request.scriptHash,
					operation: request.operation,
					args: request.args as any,
					abortOnFail: request.abortOnFail,
				},
				request.signers as any,
			);
			return this._responseToReadResult(response);
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		}
	}

	async invokeReadMulti(request: ContractReadInvocationMulti): Promise<ContractReadInvocationResult> {
		const walletConnectInstance = this._walletConnectInstance;
		if (!walletConnectInstance || !walletConnectInstance.session) throw new WalletNotConnectedError();

		try {
			const response = await walletConnectInstance.testInvoke(request.invocations as any, request.signers as any);
			return this._responseToReadResult(response);
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		}
	}

	async invoke(request: ContractWriteInvocation): Promise<ContractWriteInvocationResult> {
		const walletConnectInstance = this._walletConnectInstance;
		if (!walletConnectInstance || !walletConnectInstance.session) throw new WalletNotConnectedError();

		try {
			const response = await walletConnectInstance.invokeFunction(
				{
					scriptHash: request.scriptHash,
					operation: request.operation,
					args: request.args as any,
					abortOnFail: request.abortOnFail,
				},
				request.signers as any,
			);
			return this._responseToWriteResult(response);
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		}
	}

	async invokeMulti(request: ContractWriteInvocationMulti): Promise<ContractWriteInvocationResult> {
		const walletConnectInstance = this._walletConnectInstance;
		if (!walletConnectInstance || !walletConnectInstance.session) throw new WalletNotConnectedError();

		try {
			const response = await walletConnectInstance.invokeFunction(request.invocations as any, request.signers as any);
			return this._responseToWriteResult(response);
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		}
	}

	async signMessage(request: SignMessageInvocation): Promise<SignMessageInvocationResult> {
		const walletConnectInstance = this._walletConnectInstance;
		if (!walletConnectInstance || !walletConnectInstance.session) throw new WalletNotConnectedError();

		try {
			const response = await walletConnectInstance.signMessage(request.message);
			return this._responseToSignMessageResult(response);
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		}
	}

	private _responseToReadResult(response: RpcCallResult<any>): ContractReadInvocationResult {
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

	private _responseToWriteResult(response: RpcCallResult<any>): ContractWriteInvocationResult {
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

	private _responseToSignMessageResult(response: RpcCallResult<SignedMessage>): SignMessageInvocationResult {
		return {
			status: 'success',
			data: {
				publicKey: response.result.publicKey,
				data: response.result.data,
				salt: response.result.salt,
				message: response.result.messageHex,
			},
		};
	}

	private _disconnected() {
		const walletConnectInstance = this._walletConnectInstance;
		if (walletConnectInstance) {
			this._address = null;
			this._walletConnectInstance = undefined;

			this.emit('error', new WalletDisconnectedError());
			this.emit('disconnect');
		}
	}
}
