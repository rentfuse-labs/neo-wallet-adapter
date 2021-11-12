import { useWallet } from '@rentfuse-labs/neo-wallet-adapter-react';
import { Button, ButtonProps } from 'antd';
import React, { MouseEventHandler, useCallback, useMemo } from 'react';
import { WalletIcon } from './wallet-icon';

export const WalletDisconnectButton = React.memo(function WalletDisconnectButton({
	type = 'primary',
	size = 'large',
	children,
	disabled,
	onClick,
	...props
}: ButtonProps) {
	const { wallet, disconnect, disconnecting } = useWallet();

	const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
		(event) => {
			if (onClick) onClick(event);
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			if (!event.defaultPrevented)
				disconnect().catch(() => {
					// Silently catch because any errors are caught by the context `onError` handler
				});
		},
		[onClick, disconnect],
	);

	const content = useMemo(() => {
		if (children) return children;
		if (disconnecting) return 'Disconnecting ...';
		if (wallet) return 'Disconnect';
		return 'Disconnect Wallet';
	}, [children, disconnecting, wallet]);

	return (
		<Button
			onClick={handleClick}
			disabled={disabled || !wallet}
			icon={<WalletIcon wallet={wallet} />}
			type={type}
			size={size}
			{...props}
		>
			{content}
		</Button>
	);
});
