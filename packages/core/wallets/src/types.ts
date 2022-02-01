import { WalletAdapter } from '@rentfuse-labs/neo-wallet-adapter-base';

export enum WalletName {
	NeoLine = 'NeoLine',
	O3 = 'O3',
	WalletConnect = 'WalletConnect',
	Neon = 'Neon',
}

export interface Wallet {
	name: WalletName;
	url: string;
	icon: string;
	adapter: () => WalletAdapter;
}
