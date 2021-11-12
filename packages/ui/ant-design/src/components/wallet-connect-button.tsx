import { useWallet } from '@rentfuse-labs/neo-wallet-adapter-react';
import { Button, ButtonProps } from 'antd';
import React, { MouseEventHandler, useCallback, useMemo } from 'react';
import { WalletIcon } from './wallet-icon';

export const WalletConnectButton = React.memo(function WalletConnectButton({
	type = 'primary',
	size = 'large',
	children,
	disabled,
	onClick,
	...props
}: ButtonProps) {
	const { wallet, connect, connecting, connected } = useWallet();

	const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
		(event) => {
			if (onClick) onClick(event);
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			if (!event.defaultPrevented)
				connect().catch(() => {
					// Silently catch because any errors are caught by the context `onError` handler
				});
		},
		[onClick, connect],
	);

	const content = useMemo(() => {
		if (children) return children;
		if (connecting) return 'Connecting ...';
		if (connected) return 'Connected';
		if (wallet) return 'Connect';
		return 'Connect Wallet';
	}, [children, connecting, connected, wallet]);

	return (
		<Button
			onClick={handleClick}
			disabled={disabled || !wallet || connecting || connected}
			icon={<WalletIcon wallet={wallet} />}
			type={type}
			size={size}
			{...props}
		>
			{content}
		</Button>
	);
});
