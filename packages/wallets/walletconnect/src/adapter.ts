import { RpcCallResult, WcConnectOptions, WcSdk } from '@cityofzion/wallet-connect-sdk-core';
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
} from '@rentfuse-labs/neo-wallet-adapter-base';
import QRCodeModal from '@walletconnect/qrcode-modal';

// The configuration object used to create an instance of the wallet
export interface WalletConnectWalletAdapterConfig {
	options: WcConnectOptions;
	logger: string;
	relayServer: string;
}

// The main class for the wallet
export class WalletConnectWalletAdapter extends BaseWalletAdapter {
	private _address: string | null;
	private _connecting: boolean;

	private _options: WcConnectOptions;
	private _logger: string;
	private _relayServer: string;

	private _sdk: WcSdk;

	constructor(config: WalletConnectWalletAdapterConfig) {
		super();

		this._address = null;
		this._connecting = false;
		this._options = config.options;
		this._logger = config.logger;
		this._relayServer = config.relayServer;

		this._sdk = new WcSdk();
		this._sdk.subscribeToEvents({
			onProposal: (uri: string) => {
				// Show qrcode modal
				QRCodeModal.open(uri, () => {
					// Nothing huehuehue :)
				});
			},
			onCreated: (topics: string[]) => {
				// Nothing huehuehue :)
			},
			onDeleted: this._disconnected,
		});
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

			try {
				// Initialize sdk client
				await this._sdk.initClient(this._logger, this._relayServer);
				// Connect with the sdk client
				await this._sdk.connect(this._options);
			} catch (error: any) {
				if (error instanceof WalletError) throw error;
				throw new WalletConnectionError(error?.message, error);
			}

			// Check that the session has been correctly loaded
			if (!this._sdk.session) throw new WalletAccountError();

			try {
				// Get account address
				this._address = this._sdk.getAccountAddress();
			} catch (error: any) {
				throw new WalletAccountError(error?.message, error);
			}

			this.emit('connect');
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		} finally {
			this._connecting = false;
		}
	}

	async disconnect(): Promise<void> {
		const client = this._sdk.wcClient;
		if (client) {
			try {
				// Disconnect from the client
				await this._sdk.disconnect();

				// Cleanup data
				this._address = null;
				this._sdk.wcClient = undefined;
			} catch (error: any) {
				this.emit('error', new WalletDisconnectionError(error?.message, error));
			}
		}
		this.emit('disconnect');
	}

	async invokeRead(request: ContractReadInvocation): Promise<ContractReadInvocationResult> {
		try {
			const response = await this._sdk.testInvoke({
				scriptHash: request.scriptHash,
				operation: request.operation,
				args: request.args,
				abortOnFail: request.abortOnFail,
				signer: request.signers?.[0],
			});
			return this._responseToReadResult(response);
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		}
	}

	async invokeReadMulti(request: ContractReadInvocationMulti): Promise<ContractReadInvocationResult> {
		try {
			const response = await this._sdk.multiTestInvoke({
				invocations: request.invocations,
				signer: request.signers,
			});
			return this._responseToReadResult(response);
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		}
	}

	async invoke(request: ContractWriteInvocation): Promise<ContractWriteInvocationResult> {
		try {
			const response = await this._sdk.invokeFunction({
				scriptHash: request.scriptHash,
				operation: request.operation,
				args: request.args,
				abortOnFail: request.abortOnFail,
				signer: request.signers?.[0],
			});
			return this._responseToWriteResult(response);
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		}
	}

	async invokeMulti(request: ContractWriteInvocationMulti): Promise<ContractWriteInvocationResult> {
		try {
			const response = await this._sdk.multiInvoke({
				signer: request.signers,
				invocations: request.invocations,
			});
			return this._responseToWriteResult(response);
		} catch (error: any) {
			this.emit('error', error);
			throw error;
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
		// Cleanup sdk client and emit disconnect event
		const client = this._sdk.wcClient;
		if (client) {
			this._address = null;
			this._sdk.wcClient = undefined;

			this.emit('error', new WalletDisconnectedError());
			this.emit('disconnect');
		}
	}
}
