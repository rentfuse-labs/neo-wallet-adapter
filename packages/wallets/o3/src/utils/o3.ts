export enum O3Scope {
	None = 0,
	CalledByEntry = 1,
	CustomContracts = 16,
	CustomGroups = 32,
	Global = 128,
}

export type O3Account = {
	address: string;
	label?: string;
};

export type O3Signer = {
	// ScriptHash of the address
	account: string;
	scopes: number;
	allowedContracts?: string[];
	allowedGroups?: string[];
};

export type O3StackItemType =
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

export type O3StackItem = {
	type: O3StackItemType;
	value?: O3StackItem[] | string | boolean;
	iterator?: O3StackItem[];
	truncated?: boolean;
};

export type O3ArgumentType =
	| 'String'
	| 'Boolean'
	| 'Hash160'
	| 'Hash256'
	| 'Integer'
	| 'ByteArray'
	| 'Array'
	| 'Address';

export type O3Argument = {
	type: O3ArgumentType;
	value: string;
};

export type O3InvokeReadInvocation = {
	scriptHash: string;
	operation: string;
	args: O3Argument[];
};

export type O3InvokeWriteInvocation = {
	fee?: string;
	extraSystemFee?: string;
	broadcastOverride?: boolean;
};

export type O3ReadInvocationResult = {
	script: string;
	state: 'HALT' | 'FAULT';
	gas_consumed: string;
	stack: O3StackItem[];
};

export type O3WriteInvocationResult = {
	txId: string;
	nodeURL?: string;
	signedTx?: string;
};

// Reference at https://neo3dapidocs.o3.network/#getting-started (Taken on 09/11/21)
export interface O3N3Interface {
	getAccount(): Promise<O3Account>;

	invokeRead(params: O3InvokeReadInvocation & { signers: O3Signer[] }): Promise<O3ReadInvocationResult>;

	invokeReadMulti(
		params: { invokeReadArgs: O3InvokeReadInvocation[] } & { signers: O3Signer[] },
	): Promise<O3ReadInvocationResult>;

	invoke(
		params: O3InvokeReadInvocation & O3InvokeWriteInvocation & { signers: O3Signer[] },
	): Promise<O3WriteInvocationResult>;

	invokeMulti(
		params: { invokeArgs: O3InvokeReadInvocation[] } & O3InvokeWriteInvocation & { signers: O3Signer[] },
	): Promise<O3WriteInvocationResult>;
}
