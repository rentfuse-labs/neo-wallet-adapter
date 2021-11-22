/* eslint-disable @typescript-eslint/no-var-requires */
const withTM = require('next-transpile-modules')([
	'@rentfuse-labs/neo-wallet-adapter-base',
	'@rentfuse-labs/neo-wallet-adapter-react',
	'@rentfuse-labs/neo-wallet-adapter-wallets',
	'@rentfuse-labs/neo-wallet-adapter-react-ui',
	'@rentfuse-labs/neo-wallet-adapter-neoline',
	'@rentfuse-labs/neo-wallet-adapter-o3',
	'@rentfuse-labs/neo-wallet-adapter-walletconnect',
]);

/** @type {import('next').NextConfig} */
module.exports = withTM({
	reactStrictMode: true,
	webpack5: true,
});
