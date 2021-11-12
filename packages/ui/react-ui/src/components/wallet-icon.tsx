import { Wallet } from '@rentfuse-labs/neo-wallet-adapter-wallets';
import React, { DetailedHTMLProps, ImgHTMLAttributes } from 'react';

export interface WalletIconProps extends DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> {
	wallet: Wallet | null;
}

export const WalletIcon = React.memo(function WalletIcon({ wallet, ...props }: WalletIconProps) {
	return wallet && <img src={wallet.icon} alt={`${wallet.name} icon`} {...props} />;
});
