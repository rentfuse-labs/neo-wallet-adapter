export enum NeoLineScope {
	None = 0,
	CalledByEntry = 1,
	CustomContracts = 16,
	CustomGroups = 32,
	Global = 128,
}

export type NeoLineAccount = {
	address: string;
	label?: string;
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

export type NeoLineStackItem = {
	type: NeoLineStackItemType;
	value?: NeoLineStackItem[] | string | boolean;
	iterator?: NeoLineStackItem[];
	truncated?: boolean;
};

export type NeoLineArgumentType =
	| 'String'
	| 'Boolean'
	| 'Hash160'
	| 'Hash256'
	| 'Integer'
	| 'ByteArray'
	| 'Array'
	| 'Address';

export type NeoLineArgument = {
	type: NeoLineArgumentType;
	value: string;
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

export interface NeoLineN3Interface {
	getAccount(): Promise<NeoLineAccount>;

	invokeRead(params: NeoLineInvokeReadInvocation & { signers: NeoLineSigner[] }): Promise<NeoLineReadInvocationResult>;

	invokeReadMulti(
		params: { invokeReadArgs: NeoLineInvokeReadInvocation[] } & { signers: NeoLineSigner[] },
	): Promise<NeoLineReadInvocationResult>;

	invoke(
		params: NeoLineInvokeReadInvocation & NeoLineInvokeWriteInvocation & { signers: NeoLineSigner[] },
	): Promise<NeoLineWriteInvocationResult>;

	invokeMulti(
		params: { invokeArgs: NeoLineInvokeReadInvocation[] } & NeoLineInvokeWriteInvocation & { signers: NeoLineSigner[] },
	): Promise<NeoLineWriteInvocationResult>;
}
