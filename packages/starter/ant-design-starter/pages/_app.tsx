import { WalletModalProvider } from '@rentfuse-labs/neo-wallet-adapter-ant-design';
import { AppProps } from 'next/app';
import React from 'react';
import { WalletConnectionProvider } from '../components/wallet-connection-provider';

// Use require instead of import, and order matters
require('../styles/global.css');
require('@rentfuse-labs/neo-wallet-adapter-ant-design/styles.css');

export default function _App({ Component, pageProps }: AppProps) {
	return (
		<WalletConnectionProvider>
			<WalletModalProvider>
				<Component {...pageProps} />
			</WalletModalProvider>
		</WalletConnectionProvider>
	);
}
