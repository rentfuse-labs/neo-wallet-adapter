import { WalletAdapter } from '@rentfuse-labs/neo-wallet-adapter-base';

export enum WalletName {
	NeoLine = 'NeoLine',
	O3 = 'O3',
	WalletConnect = 'WalletConnect',
	OneGate = 'OneGate',
}

export interface Wallet {
	name: WalletName;
	url: string;
	icon: string;
	adapter: () => WalletAdapter;
}
