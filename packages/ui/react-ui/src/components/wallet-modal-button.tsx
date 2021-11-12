import React, { MouseEvent, useCallback } from 'react';
import { WalletButton, WalletButtonProps } from './wallet-button';
import { useWalletModal } from '../hooks/use-wallet-modal';

export const WalletModalButton = React.memo(function WalletModalButton({
	children = 'Select Wallet',
	onClick,
	...props
}: WalletButtonProps) {
	const { visible, setVisible } = useWalletModal();

	const handleClick = useCallback(
		(event: MouseEvent<HTMLButtonElement>) => {
			if (onClick) onClick(event);
			if (!event.defaultPrevented) setVisible(!visible);
		},
		[onClick, setVisible, visible],
	);

	return (
		<WalletButton className="wallet-adapter-button-trigger" onClick={handleClick} {...props}>
			{children}
		</WalletButton>
	);
});
