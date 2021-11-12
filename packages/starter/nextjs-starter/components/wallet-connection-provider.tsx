import React from 'react';
import { getNeoLineWallet, getO3Wallet, getWalletConnectWallet } from '@rentfuse-labs/neo-wallet-adapter-wallets';
import { ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@rentfuse-labs/neo-wallet-adapter-react';

export const WalletConnectionProvider = React.memo(function WalletConnectionProvider({
	children,
}: {
	children: ReactNode;
}) {
	// Can be set to 'devnet', 'testnet', or 'mainnet-beta'
	//const network = WalletAdapterNetwork.Devnet;
	// You can also provide a custom RPC endpoint
	//const endpoint = useMemo(() => clusterApiUrl(network), [network]);

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
				relayServer: 'wss://relay.walletconnect.org',
			}),
		],
		[],
	);

	return (
		<ConnectionProvider endpoint={'TODO'}>
			<WalletProvider wallets={wallets} autoConnect={true}>
				{children}
			</WalletProvider>
		</ConnectionProvider>
	);
});
