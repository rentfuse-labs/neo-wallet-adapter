import { WalletAdapter, WalletAdapterProps } from '@rentfuse-labs/neo-wallet-adapter-base';
import { Wallet, WalletName } from '@rentfuse-labs/neo-wallet-adapter-wallets';
import { createContext, useContext } from 'react';

// Extend wallet adapter props with other useful variables
export interface WalletContextState extends WalletAdapterProps {
	wallets: Wallet[];
	autoConnect: boolean;
	wallet: Wallet | null;
	adapter: WalletAdapter | null;
	disconnecting: boolean;
	select(walletName: WalletName): void;
}

export const WalletContext = createContext<WalletContextState>({} as WalletContextState);

export function useWallet(): WalletContextState {
	return useContext(WalletContext);
}
