import { Wallet } from '@rentfuse-labs/neo-wallet-adapter-wallets';
import React, { MouseEventHandler } from 'react';
import { WalletButton } from './wallet-button';
import { WalletIcon } from './wallet-icon';

export const WalletListItem = React.memo(function WalletListItem({
	handleClick,
	tabIndex,
	wallet,
}: {
	handleClick: MouseEventHandler<HTMLButtonElement>;
	tabIndex?: number;
	wallet: Wallet;
}) {
	return (
		<li>
			<WalletButton onClick={handleClick} endIcon={<WalletIcon wallet={wallet} />} tabIndex={tabIndex}>
				{wallet.name}
			</WalletButton>
		</li>
	);
});
