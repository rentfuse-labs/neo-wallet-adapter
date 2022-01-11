import {
	ContractReadInvocation,
	ContractReadInvocationMulti,
	ContractWriteInvocation,
	ContractWriteInvocationMulti,
	WalletAdapter,
	WalletError,
	WalletNotConnectedError,
	WalletNotReadyError,
	SignMessageInvocation,
} from '@rentfuse-labs/neo-wallet-adapter-base';
import { Wallet, WalletName } from '@rentfuse-labs/neo-wallet-adapter-wallets';
import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WalletNotSelectedError } from '../utils/errors';
import { WalletContext } from '../hooks/use-wallet';

export interface WalletProviderState {
	wallet: Wallet | null;
	adapter: WalletAdapter | null;
	ready: boolean;
	address: string | null;
	connected: boolean;
}

const WALLET_INITIAL_STATE: WalletProviderState = {
	wallet: null,
	adapter: null,
	ready: false,
	address: null,
	connected: false,
};

export const WalletProvider = React.memo(function WalletProvider({
	children,
	wallets,
	autoConnect = false,
	onError: _onError = (error: WalletError) => console.error(error),
}: {
	children: ReactNode;
	wallets: Wallet[];
	autoConnect?: boolean;
	onError?: (error: WalletError) => void;
}) {
	const [name, setName] = useState<WalletName | null>(null);
	// The main state of the wallet provider
	const [{ wallet, adapter, ready, address, connected }, setState] =
		useState<WalletProviderState>(WALLET_INITIAL_STATE);
	const [connecting, setConnecting] = useState(false);
	const [disconnecting, setDisconnecting] = useState(false);
	const isConnecting = useRef(false);
	const isDisconnecting = useRef(false);
	const isUnloading = useRef(false);

	// Map wallet names to wallets for easier usage
	const walletsByName = useMemo(
		() =>
			wallets.reduce((walletsByName, wallet) => {
				walletsByName[wallet.name] = wallet;
				return walletsByName;
			}, {} as { [name in WalletName]: Wallet }),
		[wallets],
	);

	// When the selected wallet changes, re-initialize the state
	useEffect(() => {
		const wallet = (name && walletsByName[name]) || null;
		const adapter = wallet && wallet.adapter();
		if (adapter) {
			const { ready, address, connected } = adapter;
			setState({ wallet, adapter, connected, address, ready });
		} else {
			setState(WALLET_INITIAL_STATE);
		}
	}, [name, walletsByName, setState]);

	// If autoConnect is enabled, try to connect when the adapter changes and is ready
	useEffect(() => {
		if (isConnecting.current || connecting || connected || !autoConnect || !adapter || !ready) return;

		(async function () {
			isConnecting.current = true;
			setConnecting(true);
			try {
				await adapter.connect();
			} catch (error: any) {
				// Clear the selected wallet
				setName(null);
				// Don't throw error, but onError will still be called
			} finally {
				setConnecting(false);
				isConnecting.current = false;
			}
		})();
	}, [isConnecting, connecting, connected, autoConnect, adapter, ready, setConnecting, setName]);

	// If the window is closing or reloading, ignore disconnect and error events from the adapter
	useEffect(() => {
		function listener() {
			isUnloading.current = true;
		}

		window.addEventListener('beforeunload', listener);
		return () => window.removeEventListener('beforeunload', listener);
	}, [isUnloading]);

	// Select a wallet by name
	const select = useCallback(
		async (newName: WalletName | null) => {
			if (name === newName) return;
			if (adapter) await adapter.disconnect();
			setName(newName);
		},
		[name, adapter, setName],
	);

	// Handle the adapter's ready event
	const onReady = useCallback(() => setState((state) => ({ ...state, ready: true })), [setState]);

	// Handle the adapter's connect event
	const onConnect = useCallback(() => {
		if (!adapter) return;

		const { connected, address, ready } = adapter;
		setState((state) => ({
			...state,
			connected,
			address,
			ready,
		}));
	}, [adapter, setState]);

	// Handle the adapter's disconnect event
	const onDisconnect = useCallback(() => {
		// Clear the selected wallet unless the window is unloading
		if (!isUnloading.current) setName(null);
	}, [isUnloading, setName]);

	// Handle the adapter's error event, and local errors
	const onError = useCallback(
		(error: WalletError) => {
			// Call the provided error handler unless the window is unloading
			if (!isUnloading.current) _onError(error);
			return error;
		},
		[isUnloading, _onError],
	);

	// Connect the adapter to the wallet
	const connect = useCallback(async () => {
		if (isConnecting.current || connecting || disconnecting || connected) return;
		if (!wallet || !adapter) throw onError(new WalletNotSelectedError());

		if (!ready) {
			// Clear the selected wallet
			setName(null);

			if (typeof window !== 'undefined') {
				window.open(wallet.url, '_blank');
			}

			throw onError(new WalletNotReadyError());
		}

		isConnecting.current = true;
		setConnecting(true);
		try {
			await adapter.connect();
		} catch (error: any) {
			// Clear the selected wallet
			setName(null);
			// Rethrow the error, and onError will also be called
			throw error;
		} finally {
			setConnecting(false);
			isConnecting.current = false;
		}
	}, [isConnecting, connecting, disconnecting, connected, wallet, adapter, onError, ready, setConnecting, setName]);

	// Disconnect the adapter from the wallet
	const disconnect = useCallback(async () => {
		if (isDisconnecting.current || disconnecting) return;
		if (!adapter) return setName(null);

		isDisconnecting.current = true;
		setDisconnecting(true);
		try {
			await adapter.disconnect();
		} catch (error: any) {
			// Clear the selected wallet
			setName(null);
			// Rethrow the error, and onError will also be called
			throw error;
		} finally {
			setDisconnecting(false);
			isDisconnecting.current = false;
		}
	}, [isDisconnecting, disconnecting, adapter, setDisconnecting, setName]);

	const invokeRead = useCallback(
		async (request: ContractReadInvocation) => {
			if (!adapter) throw onError(new WalletNotSelectedError());
			if (!connected) throw onError(new WalletNotConnectedError());
			return await adapter.invokeRead(request);
		},
		[adapter, onError, connected],
	);

	const invokeReadMulti = useCallback(
		async (request: ContractReadInvocationMulti) => {
			if (!adapter) throw onError(new WalletNotSelectedError());
			if (!connected) throw onError(new WalletNotConnectedError());
			return await adapter.invokeReadMulti(request);
		},
		[adapter, onError, connected],
	);

	const invoke = useCallback(
		async (request: ContractWriteInvocation) => {
			if (!adapter) throw onError(new WalletNotSelectedError());
			if (!connected) throw onError(new WalletNotConnectedError());
			return await adapter.invoke(request);
		},
		[adapter, onError, connected],
	);

	const invokeMulti = useCallback(
		async (request: ContractWriteInvocationMulti) => {
			if (!adapter) throw onError(new WalletNotSelectedError());
			if (!connected) throw onError(new WalletNotConnectedError());
			return await adapter.invokeMulti(request);
		},
		[adapter, onError, connected],
	);

	const signMessage = useCallback(
		async (request: SignMessageInvocation) => {
			if (!adapter) throw onError(new WalletNotSelectedError());
			if (!connected) throw onError(new WalletNotConnectedError());
			return await adapter.signMessage(request);
		},
		[adapter, onError, connected],
	);

	const getNetworks = useCallback(async () => {
		if (!adapter) throw onError(new WalletNotSelectedError());
		if (!connected) throw onError(new WalletNotConnectedError());
		return await adapter.getNetworks();
	}, [adapter, onError, connected]);

	// Setup and teardown event listeners when the adapter changes
	useEffect(() => {
		if (adapter) {
			adapter.on('ready', onReady);
			adapter.on('connect', onConnect);
			adapter.on('disconnect', onDisconnect);
			adapter.on('error', onError);
			return () => {
				adapter.off('ready', onReady);
				adapter.off('connect', onConnect);
				adapter.off('disconnect', onDisconnect);
				adapter.off('error', onError);
			};
		}
	}, [adapter, onReady, onConnect, onDisconnect, onError]);

	return (
		<WalletContext.Provider
			value={{
				wallets,
				autoConnect,
				wallet,
				adapter,
				address,
				ready,
				connected,
				connecting,
				disconnecting,
				select,
				connect,
				disconnect,
				invokeRead,
				invokeReadMulti,
				invoke,
				invokeMulti,
				signMessage,
				getNetworks,
			}}
		>
			{children}
		</WalletContext.Provider>
	);
});
