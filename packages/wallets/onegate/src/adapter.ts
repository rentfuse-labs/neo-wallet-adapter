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
	WalletDisconnectedError,
	WalletDisconnectionError,
	WalletError,
	WalletMethodNotSupportedError,
	WalletNotConnectedError,
} from '@rentfuse-labs/neo-wallet-adapter-base';
import { INeoDapi, NeoDapi } from '@neongd/neo-dapi';
import { NeoProvider } from '@neongd/neo-provider';

const DEFAULT_WALLET_CONFIG = { options: null };

// The configuration object used to create an instance of the wallet
export interface OneGateWalletAdapterConfig {
	options: any;
	pollInterval?: number;
	pollCount?: number;
}

// Reference at https://this._oneGateDapidocs.o3.network/#getting-started (Taken on 10/11/21)
export class OneGateWalletAdapter extends BaseWalletAdapter {
	private _address: string | null;
	private _connecting: boolean;

	// TODO: What?
	private _options: any;

	private _oneGateDapi: INeoDapi | undefined;
	private _oneGateProvider: NeoProvider | undefined;

	constructor(config: OneGateWalletAdapterConfig = DEFAULT_WALLET_CONFIG) {
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
		return typeof window !== 'undefined' && (window as any).OneGate !== 'undefined';
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
				this._oneGateProvider = (window as any).OneGate;
				if (this._oneGateProvider) {
					// Get the neoline client initializing the wallet
					this._oneGateDapi = new NeoDapi(this._oneGateProvider);
				}
			} catch (error: any) {
				if (error instanceof WalletError) throw error;
				throw new WalletConnectionError(error?.message, error);
			}

			if (!this._oneGateDapi || !this._oneGateProvider) throw new WalletAccountError();

			// Taken from https://github.com/neo-ngd/neo-dapi-monorepo/tree/master/packages/neo-dapi
			let account: { address: string; publicKey: string };
			try {
				// OneGate asks the user to connect the dapp when calling the getAccount method
				account = await this._oneGateDapi.getAccount();
			} catch (error: any) {
				throw new WalletAccountError(error?.message, error);
			}

			if (!account) throw new WalletAccountError();
			this._address = account.address;

			// Add a listener to cleanup of disconnection
			this._oneGateProvider.on('disconnect', this._disconnected);
			this._oneGateProvider.on('accountChanged', this._disconnected);
			this._oneGateProvider.on('networkChanged', this._disconnected);

			this.emit('connect');
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		} finally {
			this._connecting = false;
		}
	}

	async disconnect(): Promise<void> {
		const client = this._oneGateDapi;
		const provider = this._oneGateProvider;

		if (client && provider) {
			try {
				// TODO: How?
				//await this._oneGateDapi.disconnect();

				provider.removeListener('disconnect', this._disconnected);
				provider.removeListener('accountChanged', this._disconnected);
				provider.removeListener('networkChanged', this._disconnected);

				this._address = null;
				this._oneGateDapi = undefined;
				this._oneGateProvider = undefined;
			} catch (error: any) {
				this.emit('error', new WalletDisconnectionError(error?.message, error));
			}
		}
		this.emit('disconnect');
	}

	async invokeRead(request: ContractReadInvocation): Promise<ContractReadInvocationResult> {
		const client = this._oneGateDapi;
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
		const client = this._oneGateDapi;
		if (!client) throw new WalletNotConnectedError();

		try {
			const response = await client.invokeReadMulti({
				invocations: request.invocations,
				signers: request.signers as any,
			});
			return this._responseToReadResult(response);
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		}
	}

	async invoke(request: ContractWriteInvocation): Promise<ContractWriteInvocationResult> {
		const client = this._oneGateDapi;
		if (!client) throw new WalletNotConnectedError();

		try {
			// Remember gas fee conversion with 8 decimals as it's passed as float in input request param
			const response = await client.invoke({
				scriptHash: request.scriptHash,
				operation: request.operation,
				args: request.args,
				signers: request.signers as any,
				extraNetworkFee: request.fee ? (+request.fee * 100000000).toString() : undefined,
				extraSystemFee: request.extraSystemFee ? (+request.extraSystemFee * 100000000).toString() : undefined,
				broadcastOverride: request.broadcastOverride,
			});
			return this._responseToWriteResult(response);
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		}
	}

	async invokeMulti(request: ContractWriteInvocationMulti): Promise<ContractWriteInvocationResult> {
		const client = this._oneGateDapi;
		if (!client) throw new WalletNotConnectedError();

		try {
			// Remember gas fee conversion with 8 decimals as it's passed as float in input request param
			const response = await client.invokeMulti({
				invocations: request.invocations,
				signers: request.signers as any,
				extraNetworkFee: request.fee ? (+request.fee * 100000000).toString() : undefined,
				extraSystemFee: request.extraSystemFee ? (+request.extraSystemFee * 100000000).toString() : undefined,
				broadcastOverride: request.broadcastOverride,
			});
			return this._responseToWriteResult(response);
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		}
	}

	async getNetworks(): Promise<GetNetworksInvocationResult> {
		const client = this._oneGateDapi;
		if (!client) throw new WalletNotConnectedError();

		try {
			const response = await client.getNetworks();
			return this._responseToGetNetworksResult(response);
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		}
	}

	async signMessage(request: SignMessageInvocation): Promise<SignMessageInvocationResult> {
		const client = this._oneGateDapi;
		if (!client) throw new WalletNotConnectedError();

		// Not currently supported by Neo dAPI
		const error = {
			message: 'API method not supported',
			error: new Error('API method not supported'),
			name: 'MethodNotSupportedError',
		};
		this.emit('error', new WalletMethodNotSupportedError());
		throw error;
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

	// Arrow function to bind this correctly in event listener
	private _disconnected = () => {
		this.disconnect();
	};
}
