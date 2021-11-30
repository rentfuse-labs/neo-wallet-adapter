import React from 'react';
import { getNeoLineWallet, getO3Wallet, getWalletConnectWallet } from '@rentfuse-labs/neo-wallet-adapter-wallets';
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
			getWalletConnectWallet({
				options: {
					chainId: 'neo3:testnet',
					methods: ['invokefunction'],
					appMetadata: {
						name: 'MyApplicationName', // your application name to be displayed on the wallet
						description: 'My Application description', // description to be shown on the wallet
						url: 'https://myapplicationdescription.app/', // url to be linked on the wallet
						icons: ['https://myapplicationdescription.app/myappicon.png'], // icon to be shown on the wallet
					},
				},
				logger: 'debug',
				relayProvider: 'wss://connect.coz.io',
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
