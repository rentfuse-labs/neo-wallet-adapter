import React from 'react';
import { getNeoLineWallet, getO3Wallet, getNeonWalletConnectWallet } from '@rentfuse-labs/neo-wallet-adapter-wallets';
import { ReactNode, useMemo } from 'react';
import { WalletProvider } from '@rentfuse-labs/neo-wallet-adapter-react';

export const WalletConnectionProvider = React.memo(function WalletConnectionProvider({
	children,
}: {
	children: ReactNode;
}) {
	// @rentfuse-labs/neo-wallet-adapter-wallets includes all the adapters but supports tree shaking --
	// Only the wallets you configure here will be compiled into your application
	const wallets = useMemo(
		() => [
			getNeoLineWallet(),
			getO3Wallet(),
			getNeonWalletConnectWallet({
				options: {
					projectId: 'a9ff54e3d56a52230ed8767db4d4a810',
					relayUrl: 'wss://relay.walletconnect.com',
					metadata: {
						name: 'Example',
						description: 'Example description',
						url: 'https://neonova.space',
						icons: ['https://raw.githubusercontent.com/rentfuse-labs/neonova/main/neonova-icon.png'],
					},
				},
				network: 'neo3:testnet',
			}),
		],
		[],
	);

	return (
		<WalletProvider wallets={wallets} autoConnect={false}>
			{children}
		</WalletProvider>
	);
});
