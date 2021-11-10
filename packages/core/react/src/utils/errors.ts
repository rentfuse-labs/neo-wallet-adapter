import { WalletError } from '@rentfuse-labs/neo-wallet-adapter-base';

export class WalletNotSelectedError extends WalletError {
    name = 'WalletNotSelectedError';
}
