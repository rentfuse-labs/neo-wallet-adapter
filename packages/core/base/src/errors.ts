export class WalletError extends Error {
	public error: any;

	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	constructor(message?: string, error?: any) {
		super(message);
		this.error = error;
	}
}

export class WalletNotFoundError extends WalletError {
	name = 'WalletNotFoundError';
}

export class WalletNotInstalledError extends WalletError {
	name = 'WalletNotInstalledError';
}

export class WalletNotReadyError extends WalletError {
	name = 'WalletNotReadyError';
}

export class WalletConnectionError extends WalletError {
	name = 'WalletConnectionError';
}

export class WalletDisconnectedError extends WalletError {
	name = 'WalletDisconnectedError';
}

export class WalletDisconnectionError extends WalletError {
	name = 'WalletDisconnectionError';
}

export class WalletAccountError extends WalletError {
	name = 'WalletAccountError';
}

export class WalletNotConnectedError extends WalletError {
	name = 'WalletNotConnectedError';
}

export class WalletTimeoutError extends WalletError {
	name = 'WalletTimeoutError';
}

export class WalletWindowBlockedError extends WalletError {
	name = 'WalletWindowBlockedError';
}

export class WalletWindowClosedError extends WalletError {
	name = 'WalletWindowClosedError';
}

export class WalletMethodNotSupportedError extends WalletError {
	name = 'WalletMethodNotSupportedError';
}
