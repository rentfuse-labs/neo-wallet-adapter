import EventEmitter from 'eventemitter3';
import { WalletError } from './errors';

export { EventEmitter };

export enum WitnessScope {
	None = 0,
	CalledByEntry = 1,
	CustomContracts = 16,
	CustomGroups = 32,
	Global = 128,
}

export type Signer = {
	// ScriptHash of the address
	account: string;
	scopes: WitnessScope;
	allowedContracts?: string[];
	allowedGroups?: string[];
};

export type StackItemType =
	| 'Any'
	| 'Pointer'
	| 'Boolean'
	| 'Integer'
	| 'ByteString'
	| 'Buffer'
	| 'Array'
	| 'Struct'
	| 'Map'
	| 'InteropInterface';

export type StackItem = {
	type: StackItemType;
	value?: any;
};

export type ArgumentType =
	| 'Any'
	| 'Boolean'
	| 'Integer'
	| 'ByteArray'
	| 'String'
	| 'Hash160'
	| 'Hash256'
	| 'PublicKey'
	| 'Signature'
	| 'Array'
	| 'Map'
	| 'InteropInterface'
	| 'Void';

export type Argument = {
	type: ArgumentType;
	value: any;
};

export type ContractReadInvocation = {
	scriptHash: string;
	operation: string;
	args: Argument[];
	abortOnFail?: boolean;
	signers?: Signer[];
};

export type ContractReadInvocationMulti = {
	invocations: ContractReadInvocation[];
	signers: Signer[];
};

export type ContractWriteOptions = {
	fee?: string;
	extraSystemFee?: string;
	broadcastOverride?: boolean;
};

export type ContractWriteInvocation = ContractReadInvocation & ContractWriteOptions;

export type ContractWriteInvocationMulti = {
	invocations: ContractReadInvocation[];
	signers: Signer[];
} & ContractWriteOptions;

export type ContractReadInvocationResultData = {
	script: string;
	state: 'HALT' | 'FAULT';
	gasConsumed: string;
	stack: StackItem[];
	exception?: any;
	tx?: string;
};

export type ContractWriteInvocationResultData = {
	txId: string;
};

// JSEND convention https://github.com/omniti-labs/jsend
export type ContractReadInvocationResult = {
	status: 'success' | 'fail' | 'error';
	data?: ContractReadInvocationResultData | null;
	message?: string;
	code?: string;
};

// JSEND convention https://github.com/omniti-labs/jsend
export type ContractWriteInvocationResult = {
	status: 'success' | 'fail' | 'error';
	data?: ContractWriteInvocationResultData | null;
	message?: string;
	code?: string;
};

export type GetNetworksResultData = {
	networks: string[];
	defaultNetwork: string;
};

export type GetNetworksInvocationResult = {
	status: 'success' | 'fail' | 'error';
	data?: GetNetworksResultData | null;
	message?: string;
	code?: string;
};

export type SignMessageInvocation = {
	message: string;
	version?: number;
};

export type SignMessageResultData = {
	publicKey: string;
	data: string;
	salt: string;
	message: string;
};

export type SignMessageInvocationResult = {
	status: 'success' | 'fail' | 'error';
	data?: SignMessageResultData | null;
	message?: string;
	code?: string;
};

export interface WalletAdapterEvents {
	ready(): void;
	connect(): void;
	disconnect(): void;
	error(error: WalletError): void;
}

export interface WalletAdapterProps {
	address: string | null;
	ready: boolean;
	connecting: boolean;
	connected: boolean;

	connect(): Promise<void>;
	disconnect(): Promise<void>;
	invokeRead(request: ContractReadInvocation): Promise<ContractReadInvocationResult>;
	invokeReadMulti(request: ContractReadInvocationMulti): Promise<ContractReadInvocationResult>;
	invoke(request: ContractWriteInvocation): Promise<ContractWriteInvocationResult>;
	invokeMulti(request: ContractWriteInvocationMulti): Promise<ContractWriteInvocationResult>;
	getNetworks(): Promise<GetNetworksInvocationResult>;
	signMessage(request: SignMessageInvocation): Promise<SignMessageInvocationResult>;
}

export type WalletAdapter = WalletAdapterProps & EventEmitter<WalletAdapterEvents>;

export abstract class BaseWalletAdapter extends EventEmitter<WalletAdapterEvents> implements WalletAdapter {
	abstract address: string | null;
	abstract ready: boolean;
	abstract connecting: boolean;
	abstract connected: boolean;

	abstract connect(): Promise<void>;
	abstract disconnect(): Promise<void>;
	abstract invokeRead(request: ContractReadInvocation): Promise<ContractReadInvocationResult>;
	abstract invokeReadMulti(request: ContractReadInvocationMulti): Promise<ContractReadInvocationResult>;
	abstract invoke(request: ContractWriteInvocation): Promise<ContractWriteInvocationResult>;
	abstract invokeMulti(request: ContractWriteInvocationMulti): Promise<ContractWriteInvocationResult>;
	abstract getNetworks(): Promise<GetNetworksInvocationResult>;
	abstract signMessage(request: SignMessageInvocation): Promise<SignMessageInvocationResult>;
}
