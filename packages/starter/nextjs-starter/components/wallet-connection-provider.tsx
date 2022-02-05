import React from 'react';
import {
	getNeoLineWallet,
	getNeonWalletConnectWallet,
	getO3Wallet,
	getOneGateWallet,
	getWalletConnectWallet,
} from '@rentfuse-labs/neo-wallet-adapter-wallets';
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
					chains: ['neo3:testnet'], // ['neo3:mainnet', 'neo3:testnet', 'neo3:private']
					methods: ['invokeFunction'], // ['invokeFunction',any other method name present on the RpcServer eg. getversion]
					appMetadata: {
						name: 'Example',
						description: 'Example description',
						url: 'https://neonova.space',
						icons: ['https://raw.githubusercontent.com/rentfuse-labs/neonova/main/neonova-icon.png'],
					},
				},
				logger: 'debug',
				relayProvider: 'wss://relay.walletconnect.org',
			}),
			getNeonWalletConnectWallet({
				options: {
					chains: ['neo3:testnet'], // ['neo3:mainnet', 'neo3:testnet', 'neo3:private']
					methods: ['invokeFunction'], // ['invokeFunction',any other method name present on the RpcServer eg. getversion]
					appMetadata: {
						name: 'Example',
						description: 'Example description',
						url: 'https://neonova.space',
						icons: ['https://raw.githubusercontent.com/rentfuse-labs/neonova/main/neonova-icon.png'],
					},
				},
				logger: 'debug',
				relayProvider: 'wss://relay.walletconnect.org',
			}),
			getOneGateWallet(),
		],
		[],
	);

	return (
		<WalletProvider wallets={wallets} autoConnect={false}>
			{children}
		</WalletProvider>
	);
});
