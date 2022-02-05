/* eslint-disable */
const withTM = require('next-transpile-modules')([
	'@rentfuse-labs/neo-wallet-adapter-base',
	'@rentfuse-labs/neo-wallet-adapter-react',
	'@rentfuse-labs/neo-wallet-adapter-wallets',
	'@rentfuse-labs/neo-wallet-adapter-ant-design',
	'@rentfuse-labs/neo-wallet-adapter-neoline',
	'@rentfuse-labs/neo-wallet-adapter-o3',
	'@rentfuse-labs/neo-wallet-adapter-walletconnect',
]);

const withPlugins = require('next-compose-plugins');
const withAntdLess = require('next-plugin-antd-less');
const lessToJS = require('less-vars-to-js');
const fs = require('fs');
const path = require('path');

module.exports = withPlugins(
	[
		[
			withAntdLess,
			{
				lessLoaderOptions: {
					lessOptions: {
						javascriptEnabled: true,
						modifyVars: lessToJS(fs.readFileSync(path.resolve(__dirname, './styles/antd-custom.less'), 'utf8')),
					},
				},
			},
		],
		withTM,
	],
	{
		webpack: (config, { isServer }) => {
			if (!isServer) {
				config.resolve.fallback = {
					fs: false,
					path: false,
					os: false,
					zlib: false,
					stream: false,
					net: false,
					tls: false,
					crypto: false,
					http: false,
					https: false,
					url: false,
				};
			}
			return config;
		},
	},
);
