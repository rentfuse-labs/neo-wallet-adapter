import { u } from '@cityofzion/neon-js';
import WcSdk, { InvokeResult, Method, NetworkType, SignedMessage } from '@cityofzion/wallet-connect-sdk-core';
import {
	Argument,
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
	WalletConnectionError,
	WalletDisconnectionError,
	WalletError,
	WalletNotConnectedError,
} from '@rentfuse-labs/neo-wallet-adapter-base';
import SignClient from '@walletconnect/sign-client';
import { SignClientTypes } from '@walletconnect/types';

// The configuration object used to create an instance of the wallet
export interface WalletConnectWalletAdapterConfig {
	options: SignClientTypes.Options;
	network: NetworkType;
	methods?: Method[];
}

export class WalletConnectWalletAdapter extends BaseWalletAdapter {
	private _address: string | null;
	private _connecting: boolean;

	private _options: SignClientTypes.Options;
	private _network: NetworkType;
	private _neonWallet: boolean;
	private _methods: Method[] = ['invokeFunction', 'testInvoke', 'signMessage', 'verifyMessage'];

	private _walletConnectInstance: WcSdk | undefined;
	private _walletConnectChains: NetworkType[] = ['neo3:mainnet', 'neo3:testnet', 'neo3:private'];

	constructor(config: WalletConnectWalletAdapterConfig, neonWallet?: boolean) {
		super();

		this._address = null;
		this._connecting = false;
		this._options = config.options;
		this._network = config.network;
		if (config.methods) this._methods = config.methods;
		this._neonWallet = neonWallet ? neonWallet : false;
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
				// Create walletconnect coz instance and initialize client
				walletConnectInstance = new WcSdk(await SignClient.init(this._options));
				// Load any existing connection, it should be called after the initialization, to reestablish connections made previously
				await walletConnectInstance.manageSession();

				// If the session has not been loaded try to load it
				if (!walletConnectInstance.isConnected()) {
					// If we're here we need to connect
					await walletConnectInstance.connect(this._network, this._methods);
				}
			} catch (error: any) {
				if (error instanceof WalletError) throw error;
				throw new WalletConnectionError(error?.message, error);
			}

			if (!walletConnectInstance.isConnected()) throw new WalletAccountError();

			this._address = walletConnectInstance.getAccountAddress();
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
			const response = await walletConnectInstance.testInvoke({
				signers: request.signers as any,
				invocations: [
					{
						scriptHash: request.scriptHash,
						operation: request.operation,
						args: this._normalizeArgs(request.args) as any,
						abortOnFail: request.abortOnFail,
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
		const walletConnectInstance = this._walletConnectInstance;
		if (!walletConnectInstance || !walletConnectInstance.session) throw new WalletNotConnectedError();

		try {
			const response = await walletConnectInstance.testInvoke({
				signers: request.signers as any,
				invocations: request.invocations.map((invocation) => ({
					...invocation,
					args: this._normalizeArgs(invocation.args) as any,
				})) as any,
			});
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
			// Remember gas fee conversion with 8 decimals as it's passed as float in input request param
			const response = await walletConnectInstance.invokeFunction({
				signers: request.signers as any,
				invocations: [
					{
						scriptHash: request.scriptHash,
						operation: request.operation,
						args: this._normalizeArgs(request.args) as any,
						abortOnFail: request.abortOnFail,
					},
				],
				extraNetworkFee: request.fee ? +request.fee * 100000000 : undefined,
				extraSystemFee: request.extraSystemFee ? +request.extraSystemFee * 100000000 : undefined,
			});
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
			// Remember gas fee conversion with 8 decimals as it's passed as float in input request param
			const response = await walletConnectInstance.invokeFunction({
				signers: request.signers as any,
				invocations: request.invocations.map((invocation) => ({
					...invocation,
					args: this._normalizeArgs(invocation.args) as any,
				})),
				extraNetworkFee: request.fee ? +request.fee * 100000000 : undefined,
				extraSystemFee: request.extraSystemFee ? +request.extraSystemFee * 100000000 : undefined,
			});
			return this._responseToWriteResult(response);
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		}
	}

	async getNetworks(): Promise<GetNetworksInvocationResult> {
		try {
			const walletConnectInstance = this._walletConnectInstance;
			if (!walletConnectInstance || !walletConnectInstance.session) throw new WalletNotConnectedError();
			return this._responseToGetNetworksResult();
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		}
	}

	async signMessage(request: SignMessageInvocation): Promise<SignMessageInvocationResult> {
		const walletConnectInstance = this._walletConnectInstance;
		if (!walletConnectInstance || !walletConnectInstance.session) throw new WalletNotConnectedError();

		try {
			const response = await walletConnectInstance.signMessage({
				message: request.message,
				version: request?.version || 1,
			});
			return this._responseToSignMessageResult(response);
		} catch (error: any) {
			this.emit('error', error);
			throw error;
		}
	}

	private _responseToReadResult(response: InvokeResult): ContractReadInvocationResult {
		// If the state is halt it means that everything went well
		if (response.state === 'HALT') {
			return {
				status: 'success',
				data: {
					...(response as any),
				},
			};
		}

		// Otherwise an error occurred and so return it
		return {
			status: 'error',
			message: response.exception || '',
			code: response.exception || '',
		};
	}

	private _responseToWriteResult(response: string): ContractWriteInvocationResult {
		return {
			status: 'success',
			data: {
				txId: response,
			},
		};
	}

	private _responseToGetNetworksResult(): GetNetworksInvocationResult {
		return {
			status: 'success',
			data: {
				networks: this._walletConnectChains,
				defaultNetwork: this._network,
			},
		};
	}

	private _responseToSignMessageResult(response: SignedMessage): SignMessageInvocationResult {
		return {
			status: 'success',
			data: {
				publicKey: response.publicKey,
				data: response.data,
				salt: response.salt || '',
				message: response.messageHex,
			},
		};
	}

	private _normalizeArgs(args: Argument[]): Argument[] {
		// Needed because walletconnect accepts only an hexstring and not a base64 string
		return args.map((arg) => {
			if (arg.type === 'ByteArray') {
				// Must convert standard base64 to hex
				return { type: arg.type, value: u.base642hex(arg.value) };
			}
			if (arg.type === 'Array') {
				return { type: arg.type, value: this._normalizeArgs(arg.value) };
			}
			return arg;
		});
	}

	// Arrow function to bind this correctly and be similar to other wallets
	private _disconnected = () => {
		this.disconnect();
	};
}
