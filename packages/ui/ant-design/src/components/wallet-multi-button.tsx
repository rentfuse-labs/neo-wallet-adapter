import {
	CopyOutlined as CopyIcon,
	DisconnectOutlined as DisconnectIcon,
	SwapOutlined as SwitchIcon,
} from '@ant-design/icons';
import { useWallet } from '@rentfuse-labs/neo-wallet-adapter-react';
import { Button, ButtonProps, Dropdown, Menu } from 'antd';
import React, { useMemo } from 'react';
import { useWalletModal } from '../hooks';
import { WalletConnectButton } from './wallet-connect-button';
import { WalletIcon } from './wallet-icon';
import { WalletModalButton } from './wallet-modal-button';

export const WalletMultiButton = React.memo(function WalletMultiButton({
	type = 'primary',
	size = 'large',
	children,
	...props
}: ButtonProps) {
	const { address, wallet, disconnect } = useWallet();
	const { setVisible } = useWalletModal();

	const _address = useMemo(() => address, [address]);
	const content = useMemo(() => {
		if (children) return children;
		if (!wallet || !_address) return null;
		return _address;
	}, [children, wallet, _address]);

	if (!wallet) {
		return (
			<WalletModalButton type={type} size={size} {...props}>
				{children}
			</WalletModalButton>
		);
	}
	if (!_address) {
		return (
			<WalletConnectButton type={type} size={size} {...props}>
				{children}
			</WalletConnectButton>
		);
	}

	return (
		<Dropdown
			overlay={
				<Menu className="wallet-adapter-multi-button-menu">
					<Menu.Item className="wallet-adapter-multi-button-menu-item">
						<Button
							icon={<WalletIcon wallet={wallet} />}
							type={type}
							size={size}
							className="wallet-adapter-multi-button-menu-button"
							block
							{...props}
						>
							{wallet.name}
						</Button>
					</Menu.Item>
					<Menu.Item
						onClick={async () => {
							await navigator.clipboard.writeText(_address);
						}}
						icon={<CopyIcon className=".wallet-adapter-multi-button-icon" />}
						className="wallet-adapter-multi-button-item"
					>
						Copy address
					</Menu.Item>
					<Menu.Item
						onClick={() => setTimeout(() => setVisible(true), 100)}
						icon={<SwitchIcon className=".wallet-adapter-multi-button-icon" />}
						className="wallet-adapter-multi-button-item"
					>
						Connect a different wallet
					</Menu.Item>
					<Menu.Item
						onClick={() => {
							// eslint-disable-next-line @typescript-eslint/no-empty-function
							disconnect().catch(() => {
								// Silently catch because any errors are caught by the context `onError` handler
							});
						}}
						icon={<DisconnectIcon className=".wallet-adapter-multi-button-icon" />}
						className="wallet-adapter-multi-button-item"
					>
						Disconnect
					</Menu.Item>
				</Menu>
			}
			trigger={['click']}
		>
			<Button icon={<WalletIcon wallet={wallet} />} type={type} size={size} {...props}>
				{content}
			</Button>
		</Dropdown>
	);
});
