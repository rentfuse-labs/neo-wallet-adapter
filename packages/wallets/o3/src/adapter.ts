import { O3Account, O3N3Interface, O3ReadInvocationResult, O3Signer, O3WriteInvocationResult } from './utils/o3';
import {
	BaseWalletAdapter,
	pollUntilReady,
	WalletNotFoundError,
	WalletError,
	WalletConnectionError,
	WalletAccountError,
	WalletDisconnectionError,
	WalletNotConnectedError,
	WalletDisconnectedError,
	Signer,
	ContractReadInvocation,
	ContractReadInvocationMulti,
	ContractWriteInvocation,
	ContractWriteInvocationMulti,
	ContractReadInvocationResult,
	ContractWriteInvocationResult,
} from '@rentfuse-labs/neo-wallet-adapter-base';

// The configuration object used to create an instance of the wallet
export interface O3WalletAdapterConfig {
	options: any;
	pollInterval?: number;
	pollCount?: number;
}

// The main class for the wallet
export class O3WalletAdapter extends BaseWalletAdapter {
	private _address: string | null;
	private _connecting: boolean;

	// TODO: What?
	private _options: any;

	private _client: O3N3Interface | undefined;

	constructor(config: O3WalletAdapterConfig) {
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

			// Check that o3 wallet is injected into the window object
			const wallet = (window as any).NEOLineN3;
			if (!wallet) throw new WalletNotFoundError();

			try {
				// Get the o3 client initializing the wallet
				this._client = await wallet.Init();
			} catch (error: any) {
				if (error instanceof WalletError) throw error;
				throw new WalletConnectionError(error?.message, error);
			}

			if (!this._client) throw new WalletAccountError();

			let account: O3Account;
			try {
				// O3 asks the user to connect the dapp when calling the getAccount method
				account = await this._client.getAccount();
			} catch (error: any) {
				throw new WalletAccountError(error?.message, error);
			}

			if (!account) throw new WalletAccountError();
			this._address = account.address;

			// Add a listener to cleanup of disconnection
			window.addEventListener('NEOLine.NEO.EVENT.DISCONNECTED', this._disconnected);

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
				// TODO: Disconnect from the client, how?
				//await this._client.disconnect();

				// Cleanup data
				this._address = null;
				this._client = undefined;
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
				signers: request.signers ? this._signers(request.signers) : [],
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
				signers: request.signers ? this._signers(request.signers) : [],
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
				signers: request.signers ? this._signers(request.signers) : [],
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
			const response = await client.invokeMulti({
				invokeArgs: request.invocations,
				signers: request.signers ? this._signers(request.signers) : [],
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

	private _signers(signers: Signer[]): O3Signer[] {
		return signers.map((signer) => ({
			account: signer.account,
			scopes: signer.scope,
			allowedContracts: signer.allowedContracts,
			allowedGroups: signer.allowedGroups,
		}));
	}

	private _responseToReadResult(response: O3ReadInvocationResult): ContractReadInvocationResult {
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

	private _responseToWriteResult(response: O3WriteInvocationResult): ContractWriteInvocationResult {
		return {
			status: 'success',
			data: {
				txId: response.txId,
			},
		};
	}

	private _disconnected() {
		const client = this._client;
		if (client) {
			window.removeEventListener('NEOLine.NEO.EVENT.DISCONNECTED', this._disconnected);

			this._address = null;
			this._client = undefined;

			this.emit('error', new WalletDisconnectedError());
			this.emit('disconnect');
		}
	}
}
