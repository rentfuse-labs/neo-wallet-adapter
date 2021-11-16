# `@rentfuse-labs/neo-wallet-adapter`

Modular TypeScript wallet adapters and components for NEO N3 applications.

## Quick Setup (using React UI)

There is also [ant-design](https://github.com/rentfuse-labs/neo-wallet-adapter/tree/master/packages/ui/ant-design) package if you use this component framework.

### Install

Install these dependencies:

```shell
yarn add @rentfuse-labs/neo-wallet-adapter-wallets \
         @rentfuse-labs/neo-wallet-adapter-base \
         @rentfuse-labs/neo-wallet-adapter-react \
         @rentfuse-labs/neo-wallet-adapter-react-ui \
         @cityofzion/neon-js^5.0.0-next.16 \
         react
```

### Setup

```tsx
import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@rentfuse-labs/neo-wallet-adapter-react';
import { WalletAdapterNetwork } from '@rentfuse-labs/neo-wallet-adapter-base';
import { getNeoLineWallet, getO3Wallet, getWalletConnect } from '@rentfuse-labs/neo-wallet-adapter-wallets';
import {
	WalletModalProvider,
	WalletDisconnectButton,
	WalletMultiButton,
} from '@rentfuse-labs/neo-wallet-adapter-react-ui';

// Default styles that can be overridden by your app
require('@rentfuse-labs/neo-wallet-adapter-react-ui/styles.css');

export const Wallet = React.useMemo(() => {
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
				<WalletModalProvider>
					<WalletMultiButton />
					<WalletDisconnectButton />
				</WalletModalProvider>
			</WalletProvider>
		</ConnectionProvider>
	);
});
```

You can pass in these optional display props to `WalletModalProvider`:

| prop            | type        | default     | description                                                   |
| --------------- | ----------- | ----------- | ------------------------------------------------------------- |
| className       | `string`    | `""`        | additional modal class name                                   |
| logo            | `ReactNode` | `undefined` | your logo url or image element                                |
| featuredWallets | `number`    | `3`         | initial number of wallets to display in the modal             |
| container       | `string`    | `"body"`    | CSS selector for the container element to append the modal to |

For example, to show your logo:

```tsx
<WalletModalProvider logo="YOUR_LOGO_URL">...</WalletModalProvider>
```

### Usage

```tsx
import { WalletNotConnectedError } from '@rentfuse-labs/neo-wallet-adapter-base';
import { useWallet } from '@rentfuse-labs/neo-wallet-adapter-react';
import React, { useCallback, useMemo } from 'react';

export const SendOneNeoToRandomAddress = React.useMemo(() => {
	const { address, invoke } = useWallet();

	const onClick = useCallback(async () => {
		if (!address) throw new WalletNotConnectedError();

		const request = {
			scriptHash: 'ef4073a0f2b305a38ec4050e4d3d28bc40ea63f5',
			operation: 'transfer',
			args: [
				{
					type: 'Address',
					value: 'NaUjKgf5vMuFt7Ffgfffcpc41uH3adx1jq',
				},
				{
					type: 'Address',
					value: 'NaUjKgf5vMuFt7Ffgfffcpc41uH3adx1jq',
				},
				{
					type: 'Integer',
					value: '1',
				},
				{
					type: 'Any',
					value: null,
				},
			],
			fee: '0.0001',
			broadcastOverride: false,
			signers: [
				{
					account: '2cab903ff032ac693f8514581665be534beac39f',
					scopes: 1,
				},
			],
		};

		// Invoke the contract call and get the result
		const result = await invoke(request);
	}, [address, invoke]);

	return (
		<button onClick={onClick} disabled={!address}>
			Send 1 Neo to a random address!
		</button>
	);
});
```

## Packages

This library is organized into small packages with few dependencies.
To add it to your dApp, you only need the core packages and UI components for your chosen framework.

### Core

These packages are what most projects can use to support wallets on Neo N3.

| package                                                                                          | description                                           | npm                                                                                                                |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [wallets](https://github.com/rentfuse-labs/neo-wallet-adapter/tree/master/packages/core/wallets) | All wallets with icons                                | [`@rentfuse-labs/neo-wallet-adapter-wallets`](https://npmjs.com/package/@rentfuse-labs/neo-wallet-adapter-wallets) |
| [base](https://github.com/rentfuse-labs/neo-wallet-adapter/tree/master/packages/core/base)       | Adapter interfaces, error types, and common utilities | [`@rentfuse-labs/neo-wallet-adapter-base`](https://npmjs.com/package/@rentfuse-labs/neo-wallet-adapter-base)       |
| [react](https://github.com/rentfuse-labs/neo-wallet-adapter/tree/master/packages/core/react)     | Contexts and hooks for React dApps                    | [`@rentfuse-labs/neo-wallet-adapter-react`](https://npmjs.com/package/@rentfuse-labs/neo-wallet-adapter-react)     |

### UI Components

These packages provide components for common UI frameworks.

| package                                                                                              | description                                      | npm                                                                                                                      |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| [ant-design](https://github.com/rentfuse-labs/neo-wallet-adapter/tree/master/packages/ui/ant-design) | Components for [Ant Design](https://ant.design)  | [`@rentfuse-labs/neo-wallet-adapter-ant-design`](https://npmjs.com/package/@rentfuse-labs/neo-wallet-adapter-ant-design) |
| [react-ui](https://github.com/rentfuse-labs/neo-wallet-adapter/tree/master/packages/ui/react-ui)     | Components for React (no UI framework, just CSS) | [`@rentfuse-labs/neo-wallet-adapter-react-ui`](https://npmjs.com/package/@rentfuse-labs/neo-wallet-adapter-react-ui)     |

### Starter Projects

These packages provide projects that you can use to start building a dApp with built-in wallet support.

| package                                                                                                           | description                                       | npm                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| [nextjs-starter](https://github.com/rentfuse-labs/neo-wallet-adapter/tree/master/packages/starter/nextjs-starter) | [Next.js](https://nextjs.org) project using React | [`@rentfuse-labs/neo-wallet-adapter-nextjs-starter`](https://npmjs.com/package/@rentfuse-labs/neo-wallet-adapter-nextjs-starter) |

### Wallets

These packages provide adapters for each wallet.
The core [wallets](https://github.com/rentfuse-labs/neo-wallet-adapter/tree/master/packages/wallets) package already includes them, so you don't need to add these as dependencies.

| package                                                                                                 | description                                            | npm                                                                                                                            |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| [neoline](https://github.com/rentfuse-labs/neo-wallet-adapter/tree/master/packages/neoline)             | Adapter for [NeoLine](https://neoline.io/)             | [`@rentfuse-labs/neo-wallet-adapter-neoline`](https://npmjs.com/package/@rentfuse-labs/neo-wallet-adapter-neoline)             |
| [o3](https://github.com/rentfuse-labs/neo-wallet-adapter/tree/master/packages/o3)                       | Adapter for [O3](https://o3.network/)                  | [`@rentfuse-labs/neo-wallet-adapter-o3`](https://npmjs.com/package/@rentfuse-labs/neo-wallet-adapter-o3)                       |
| [walletconnect](https://github.com/rentfuse-labs/neo-wallet-adapter/tree/master/packages/walletconnect) | Adapter for [WalletConnect](https://walletconnect.org) | [`@rentfuse-labs/neo-wallet-adapter-walletconnect`](https://npmjs.com/package/@rentfuse-labs/neo-wallet-adapter-walletconnect) |

## Build from Source

1. Clone the project:

```shell
git clone https://github.com/rentfuse-labs/neo-wallet-adapter.git
```

2. Install dependencies:

```shell
cd wallet-adapter
yarn install
```

3. Build all packages:

```shell
yarn build
```

4. Run locally:

```shell
cd packages/starter/react-ui-starter
yarn start
```
