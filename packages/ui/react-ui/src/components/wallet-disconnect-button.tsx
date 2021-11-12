import { useWallet } from '@rentfuse-labs/neo-wallet-adapter-react';
import React, { MouseEventHandler, useCallback, useMemo } from 'react';
import { WalletButton, WalletButtonProps } from './wallet-button';
import { WalletIcon } from './wallet-icon';

export const WalletDisconnectButton = React.memo(function WalletDisconnectButton({
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
	const { wallet, disconnect, disconnecting } = useWallet();

	const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
		(event) => {
			if (onClick) onClick(event);
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			if (!event.defaultPrevented) disconnect().catch(() => {});
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
		<WalletButton
			className="wallet-adapter-button-trigger"
			disabled={disabled || !wallet}
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
