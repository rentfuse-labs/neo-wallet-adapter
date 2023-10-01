import {
	NeoLineMobileWalletAdapter,
	NeoLineMobileWalletAdapterConfig,
} from '@rentfuse-labs/neo-wallet-adapter-neolinemobile';
import { Wallet, WalletName } from './types';

export const getNeoLineMobileWallet = (config?: NeoLineMobileWalletAdapterConfig): Wallet => ({
	name: WalletName.NeoLineMobile,
	url: 'https://neoline.io/',
	icon: 'data:image/jpeg;base64,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',
	adapter: () => new NeoLineMobileWalletAdapter(config),
});