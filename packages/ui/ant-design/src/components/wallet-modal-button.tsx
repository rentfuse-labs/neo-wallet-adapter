import { Button, ButtonProps } from 'antd';
import React, { MouseEventHandler, useCallback } from 'react';
import { useWalletModal } from '../hooks';

export const WalletModalButton = React.memo(function WalletModalButton({
	children = 'Select Wallet',
	type = 'primary',
	size = 'large',
	onClick,
	...props
}: ButtonProps) {
	const { setVisible } = useWalletModal();

	const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
		(event) => {
			if (onClick) onClick(event);
			if (!event.defaultPrevented) setVisible(true);
		},
		[onClick, setVisible],
	);

	return (
		<Button onClick={handleClick} type={type} size={size} {...props}>
			{children}
		</Button>
	);
});
