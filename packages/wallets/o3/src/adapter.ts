import {
	BaseWalletAdapter,
	ContractReadInvocation,
	ContractReadInvocationMulti,
	ContractReadInvocationResult,
	ContractWriteInvocation,
	ContractWriteInvocationMulti,
	ContractWriteInvocationResult,
	GetNetworksInvocationResult,
	SignMessageInvocation,
	SignMessageInvocationResult,
	WalletAccountError,
	WalletDisconnectedError,
	WalletDisconnectionError,
} from '@rentfuse-labs/neo-wallet-adapter-base';
import neo3Dapi from 'neo3-dapi';

const DEFAULT_WALLET_CONFIG = { options: null };

// The configuration object used to create an instance of the wallet
export interface O3WalletAdapterConfig {
	options: any;
}

// Reference at https://neo3dapidocs.o3.network/#getting-started (Taken on 10/11/21)
export class O3WalletAdapter extends BaseWalletAdapter {
	private _address: string | null;
	private _connecting: boolean;

	// TODO: What?
	private _options: any;

	constructor(config: O3WalletAdapterConfig = DEFAULT_WALLET_CONFIG) {
		super();

		this._address = null;
		this._connecting = false;
		this._options = config.options;
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

			// Taken from o3 specs
			let account: { address: string; label: string };
			try {
				// O3 asks the user to connect the dapp when calling the getAccount method
				account = await neo3Dapi.getAccount();
			} catch (error: any) {
				throw new WalletAccountError(error?.message, error);
			}

			if (!account) throw new WalletAccountError();
			this._address = account.address;

			// Add a listener to cleanup of disconnection
			neo3Dapi.addEventListener(neo3Dapi.Constants.EventName.DISCONNECTED, this._disconnected);
			neo3Dapi.addEventListener(neo3Dapi.Constants.EventName.ACCOUNT_CHANGED, this._disconnected);
			neo3Dapi.addEventListener(neo3Dapi.Constants.EventName.NETWORK_CHANGED, this._disconnected);

			this.emit('connect');
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		} finally {
			this._connecting = false;
		}
	}

	async disconnect(): Promise<void> {
		try {
			neo3Dapi.removeEventListener(neo3Dapi.Constants.EventName.DISCONNECTED);
			neo3Dapi.removeEventListener(neo3Dapi.Constants.EventName.ACCOUNT_CHANGED);
			neo3Dapi.removeEventListener(neo3Dapi.Constants.EventName.NETWORK_CHANGED);

			// TODO: How?
			//await neo3Dapi.disconnect();

			this._address = null;
		} catch (error: any) {
			this.emit('error', new WalletDisconnectionError(error?.message, error));
		}
		this.emit('disconnect');
	}

	async invokeRead(request: ContractReadInvocation): Promise<ContractReadInvocationResult> {
		try {
			const response = await neo3Dapi.invokeRead({
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
		try {
			const response = await neo3Dapi.invokeReadMulti({
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
		try {
			const response = await neo3Dapi.invoke({
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
		try {
			const response = await neo3Dapi.invokeMulti({
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
		try {
			const response = await neo3Dapi.getNetworks();
			return this._responseToGetNetworksResult(response);
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		}
	}

	async signMessage(request: SignMessageInvocation): Promise<SignMessageInvocationResult> {
		try {
			const response = await neo3Dapi.signMessage({
				message: request.message,
			});
			return this._responseToSignMessageResult(response);
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		}
	}

	private _responseToReadResult(response: any): ContractReadInvocationResult {
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

	private _responseToWriteResult(response: any): ContractWriteInvocationResult {
		return {
			status: 'success',
			data: {
				txId: response.txid,
			},
		};
	}

	private _responseToGetNetworksResult(response: any): GetNetworksInvocationResult {
		return {
			status: 'success',
			data: {
				networks: response.networks,
				defaultNetwork: response.defaultNetwork,
			},
		};
	}

	private _responseToSignMessageResult(response: any): SignMessageInvocationResult {
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
