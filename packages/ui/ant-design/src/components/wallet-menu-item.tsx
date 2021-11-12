import { Wallet } from '@rentfuse-labs/neo-wallet-adapter-wallets';
import { Button, Menu, MenuItemProps } from 'antd';
import React, { MouseEventHandler } from 'react';
import { WalletIcon } from './wallet-icon';

interface WalletMenuItemProps extends Omit<MenuItemProps, 'onClick'> {
	onClick: MouseEventHandler<HTMLButtonElement>;
	wallet: Wallet;
}

export const WalletMenuItem = React.memo(function WalletMenuItem({ onClick, wallet, ...props }: WalletMenuItemProps) {
	return (
		<Menu.Item className="wallet-adapter-modal-menu-item" {...props}>
			<Button
				onClick={onClick}
				icon={<WalletIcon wallet={wallet} className="wallet-adapter-modal-menu-button-icon" />}
				type="text"
				className="wallet-adapter-modal-menu-button"
				block
			>
				{wallet.name}
			</Button>
		</Menu.Item>
	);
});
