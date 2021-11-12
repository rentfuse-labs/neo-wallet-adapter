import { useWallet } from '@rentfuse-labs/neo-wallet-adapter-react';
import React, { MouseEventHandler, useCallback, useMemo } from 'react';
import { WalletButton, WalletButtonProps } from './wallet-button';
import { WalletIcon } from './wallet-icon';

export const WalletConnectButton = React.memo(function WalletConnectButton({
	children,
	className,
	disabled,
	endIcon,
	startIcon,
	style,
	tabIndex,
	onClick,
	...props
}: WalletButtonProps) {
	const { wallet, connect, connecting, connected } = useWallet();

	const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
		(event) => {
			if (onClick) onClick(event);
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			if (!event.defaultPrevented) connect().catch(() => {});
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
		<WalletButton
			className="wallet-adapter-button-trigger"
			disabled={disabled || !wallet || connecting || connected}
			startIcon={wallet ? <WalletIcon wallet={wallet} /> : undefined}
			endIcon={endIcon}
			style={style}
			tabIndex={tabIndex}
			onClick={handleClick}
			{...props}
		>
			{content}
		</WalletButton>
	);
});
