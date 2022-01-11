export enum NeoLineScope {
	None = 0,
	CalledByEntry = 1,
	CustomContracts = 16,
	CustomGroups = 32,
	Global = 128,
}

export enum NeoLineChainId {
	Neo2MainNet = 1,
	Neo2TestNet = 2,
	Neo3MainNet = 3,
	Neo3TestNet = 4,
}

export type NeoLineAccount = {
	address: string;
	label?: string;
};

export type NeoLineNetworks = {
	chainId: NeoLineChainId;
	defaultNetwork: string;
	networks: string[];
};

export type NeoLineSigner = {
	// ScriptHash of the address
	account: string;
	scopes: number;
	allowedContracts?: string[];
	allowedGroups?: string[];
};

export type NeoLineStackItemType =
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

export type NeoLineStackItem = {
	type: NeoLineStackItemType;
	value?: any;
};

export type NeoLineArgumentType =
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

export type NeoLineArgument = {
	type: NeoLineArgumentType;
	value: any;
};

export type NeoLineInvokeReadInvocation = {
	scriptHash: string;
	operation: string;
	args: NeoLineArgument[];
};

export type NeoLineInvokeWriteInvocation = {
	fee?: string;
	extraSystemFee?: string;
	broadcastOverride?: boolean;
};

export type NeoLineReadInvocationResult = {
	script: string;
	state: 'HALT' | 'FAULT';
	gas_consumed: string;
	stack: NeoLineStackItem[];
};

export type NeoLineWriteInvocationResult = {
	txid: string;
	nodeURL?: string;
	signedTx?: string;
};

export type NeoLineSignMessageInvocation = {
	message: string;
};

export type NeoLineSignMessageInvocationResult = {
	publicKey: string;
	data: string;
	salt: string;
	message: string;
};

export async function NeoLineN3Init(): Promise<NeoLineN3Interface> {
	// Use an async pattern as the global NEOLineN3 is not available while
	// the NEOLine.NEO.EVENT.READY event is still firing:
	return new Promise((resolve) =>
		setTimeout(() => {
			resolve(new (window as any).NEOLineN3.Init());
		}, 10),
	);
}

export async function NeoLineInit(): Promise<NeoLineInterface> {
	// Use an async pattern as the global NEOLineN3 is not available while
	// the NEOLine.NEO.EVENT.READY event is still firing:
	return new Promise((resolve) =>
		setTimeout(() => {
			resolve(new (window as any).NEOLine.Init());
		}, 10),
	);
}

export interface NeoLineN3Interface {
	getAccount(): Promise<NeoLineAccount>;

	invokeRead(params: NeoLineInvokeReadInvocation & { signers: NeoLineSigner[] }): Promise<NeoLineReadInvocationResult>;

	invokeReadMulti(
		params: { invokeReadArgs: NeoLineInvokeReadInvocation[] } & { signers: NeoLineSigner[] },
	): Promise<NeoLineReadInvocationResult>;

	invoke(
		params: NeoLineInvokeReadInvocation & NeoLineInvokeWriteInvocation & { signers: NeoLineSigner[] },
	): Promise<NeoLineWriteInvocationResult>;

	invokeMultiple(
		params: { invokeArgs: NeoLineInvokeReadInvocation[] } & NeoLineInvokeWriteInvocation & { signers: NeoLineSigner[] },
	): Promise<NeoLineWriteInvocationResult>;

	signMessage(params: NeoLineSignMessageInvocation): Promise<NeoLineSignMessageInvocationResult>;
}

export interface NeoLineInterface {
	getNetworks(): Promise<NeoLineNetworks>;
}
