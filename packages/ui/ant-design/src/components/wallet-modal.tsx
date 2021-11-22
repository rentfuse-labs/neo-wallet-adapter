import { useWallet } from '@rentfuse-labs/neo-wallet-adapter-react';
import { WalletName } from '@rentfuse-labs/neo-wallet-adapter-wallets';
import { Menu, Modal, ModalProps } from 'antd';
import React, { MouseEvent, useCallback, useMemo, useState } from 'react';
import { useWalletModal } from '../hooks';
import { WalletMenuItem } from './wallet-menu-item';

export interface WalletModalProps extends Omit<ModalProps, 'visible'> {
	featuredWallets?: number;
}

export const WalletModal = React.memo(function WalletModal({
	title = 'Select your wallet',
	featuredWallets = 3,
	onCancel,
	...props
}: WalletModalProps) {
	const { wallets, select } = useWallet();
	const { visible, setVisible } = useWalletModal();
	const [expanded, setExpanded] = useState(false);

	const [featured, more] = useMemo(
		() => [wallets.slice(0, featuredWallets), wallets.slice(featuredWallets)],
		[wallets, featuredWallets],
	);

	const handleCancel = useCallback(
		(event: MouseEvent<HTMLElement>) => {
			if (onCancel) onCancel(event);
			if (!event.defaultPrevented) setVisible(false);
		},
		[onCancel, setVisible],
	);

	const handleWalletClick = useCallback(
		(event: MouseEvent<HTMLElement>, walletName: WalletName) => {
			select(walletName);
			handleCancel(event);
		},
		[select, handleCancel],
	);

	const onOpenChange = useCallback(() => setExpanded(!expanded), [setExpanded, expanded]);

	return (
		<Modal title={title} visible={visible} centered={true} onCancel={handleCancel} footer={null} {...props}>
			<Menu className="wallet-adapter-modal-menu" inlineIndent={0} mode="inline" onOpenChange={onOpenChange}>
				{featured.map((wallet) => (
					<WalletMenuItem
						key={wallet.name}
						onClick={(event) => handleWalletClick(event, wallet.name)}
						wallet={wallet}
					/>
				))}
				{more.length ? (
					<Menu.SubMenu key="wallet-adapter-modal-submenu" title={`${expanded ? 'Less' : 'More'} options`}>
						{more.map((wallet) => (
							<WalletMenuItem
								key={wallet.name}
								onClick={(event) => handleWalletClick(event, wallet.name)}
								wallet={wallet}
							/>
						))}
					</Menu.SubMenu>
				) : null}
			</Menu>
		</Modal>
	);
});
