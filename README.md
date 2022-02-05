<p align="center">
  <img width="200" src="./neo-wallet-adapter_icon.png">
</p>

<h3 align="center">Modular TypeScript wallet adapters and components for NEO N3 applications.</h3>

## 💾 Quick Setup (with React UI)

There is also [ant-design](https://github.com/rentfuse-labs/neo-wallet-adapter/tree/master/packages/ui/ant-design) package if you use this component framework.

### Install

Install these dependencies:

```shell
yarn add @rentfuse-labs/neo-wallet-adapter-wallets @rentfuse-labs/neo-wallet-adapter-base @rentfuse-labs/neo-wallet-adapter-react @rentfuse-labs/neo-wallet-adapter-react-ui @cityofzion/neon-js@next react
```

or 


```shell
npm install @rentfuse-labs/neo-wallet-adapter-wallets @rentfuse-labs/neo-wallet-adapter-base @rentfuse-labs/neo-wallet-adapter-react @rentfuse-labs/neo-wallet-adapter-react-ui @cityofzion/neon-js@next react
```

### Setup

```tsx
import React, { useMemo } from 'react';
import { WalletProvider } from '@rentfuse-labs/neo-wallet-adapter-react';
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
		],
		[],
	);

	return (
		<WalletProvider wallets={wallets} autoConnect={true}>
			<WalletModalProvider>
				<WalletMultiButton />
				<WalletDisconnectButton />
			</WalletModalProvider>
		</WalletProvider>
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
import { waitTx, WitnessScope, WalletNotConnectedError } from '@rentfuse-labs/neo-wallet-adapter-base';
import { useWallet } from '@rentfuse-labs/neo-wallet-adapter-react';
import { u, sc, wallet } from '@cityofzion/neon-js';
import React, { useCallback } from 'react';

export const NeoSendButton = React.memo(function NeoSendButton() {
	const { address, connected, invoke } = useWallet();

	const onClick = useCallback(async () => {
		if (!address || !connected) throw new WalletNotConnectedError();

		// Construct the request and invoke it
		const result = await invoke({
			scriptHash: 'ef4073a0f2b305a38ec4050e4d3d28bc40ea63f5',
			operation: 'transfer',
			args: [
				{
					type: 'Hash160',
					value: sc.ContractParam.hash160(address).toJson().value,
				},
				{
					type: 'Hash160',
					value: sc.ContractParam.hash160('NaUjKgf5vMuFt7Ffgfffcpc41uH3adx1jq').toJson().value,
				},
				{
					type: 'Integer',
					value: sc.ContractParam.integer(1).toJson().value,
				},
				{
					type: 'Any',
					value: null,
				},
			],
			signers: [
				{
					account: wallet.getScriptHashFromAddress(address),
					scope: WitnessScope.CalledByEntry,
				},
			],
		});

		// Optional: Wait for the transaction to be confirmed onchain
		if (result.data?.txId) {
			await waitTx('NETWORK_RPC_ADDRESS_HERE', result.data?.txId);
		}
	}, [address, connected, invoke]);

	return (
		<button onClick={onClick} disabled={!address || !connected}>
			{'Send 1 Neo!'}
		</button>
	);
});
```

## 🎁 Packages

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

| package                                                                                                                   | description                                       | npm                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| [nextjs-starter](https://github.com/rentfuse-labs/neo-wallet-adapter/tree/master/packages/starter/nextjs-starter)         | [Next.js](https://nextjs.org) project using React | [`@rentfuse-labs/neo-wallet-adapter-nextjs-starter`](https://npmjs.com/package/@rentfuse-labs/neo-wallet-adapter-nextjs-starter)         |
| [ant-design-starter](https://github.com/rentfuse-labs/neo-wallet-adapter/tree/master/packages/starter/ant-design-starter) | [Next.js](https://nextjs.org) project using React | [`@rentfuse-labs/neo-wallet-adapter-ant-design-starter`](https://npmjs.com/package/@rentfuse-labs/neo-wallet-adapter-ant-design-starter) |

### Wallets

These packages provide adapters for each wallet.
The core [wallets](https://github.com/rentfuse-labs/neo-wallet-adapter/tree/master/packages/wallets) package already includes them, so you don't need to add these as dependencies.

| package                                                                                                 | description                                            | npm                                                                                                                            |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| [neoline](https://github.com/rentfuse-labs/neo-wallet-adapter/tree/master/packages/neoline)             | Adapter for [NeoLine](https://neoline.io/)             | [`@rentfuse-labs/neo-wallet-adapter-neoline`](https://npmjs.com/package/@rentfuse-labs/neo-wallet-adapter-neoline)             |
| [o3](https://github.com/rentfuse-labs/neo-wallet-adapter/tree/master/packages/o3)                       | Adapter for [O3](https://o3.network/)                  | [`@rentfuse-labs/neo-wallet-adapter-o3`](https://npmjs.com/package/@rentfuse-labs/neo-wallet-adapter-o3)                       |
| [walletconnect](https://github.com/rentfuse-labs/neo-wallet-adapter/tree/master/packages/walletconnect) | Adapter for [WalletConnect](https://walletconnect.org) | [`@rentfuse-labs/neo-wallet-adapter-walletconnect`](https://npmjs.com/package/@rentfuse-labs/neo-wallet-adapter-walletconnect) |

## ⚙️ Build from Source

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

### Development notes

Dev dependencies are equal to peer dependencies to be used while developing.
