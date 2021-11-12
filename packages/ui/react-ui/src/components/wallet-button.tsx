import React, { CSSProperties, MouseEvent, ReactElement, ReactNode } from 'react';

export interface WalletButtonProps {
	children?: ReactNode;
	className?: string;
	disabled?: boolean;
	endIcon?: ReactElement;
	startIcon?: ReactElement;
	style?: CSSProperties;
	tabIndex?: number;
	onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}

export const WalletButton = React.memo(function WalletButton({
	children,
	className,
	disabled,
	endIcon,
	startIcon,
	style,
	tabIndex,
	onClick,
}: WalletButtonProps) {
	const justifyContent = endIcon || startIcon ? 'space-between' : 'center';

	return (
		<button
			className={`wallet-adapter-button ${className || ''}`}
			disabled={disabled}
			onClick={onClick}
			style={{ justifyContent, ...style }}
			tabIndex={tabIndex || 0}
			type="button"
		>
			{startIcon && <i className="wallet-adapter-button-start-icon">{startIcon}</i>}
			{children}
			{endIcon && <i className="wallet-adapter-button-end-icon">{endIcon}</i>}
		</button>
	);
});
