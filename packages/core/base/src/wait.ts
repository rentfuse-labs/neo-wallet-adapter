import { rpc } from '@cityofzion/neon-js';

export async function waitTx(rpcAddress: string, txId: string, readFrequency = 1000, timeout = 30000): Promise<void> {
	const start = Date.now();
	const rpcClient = new rpc.RPCClient(rpcAddress);

	// Wait until the transaction can be found, if it's found it means it's ok because it has been inserted in a block
	// Otherwise trigger the timeout meaning that it's not inserted in the block (average block time 15s)
	let transaction = null;
	do {
		// Throw an error if the timeout has passed
		if (Date.now() - start > timeout) throw new Error();

		try {
			// Get the transaction from the rpcClient
			transaction = await rpcClient.getRawTransaction(txId);
		} catch (e) {
			// Sleep for the next cycle
			await new Promise((resolve) => setTimeout(resolve, readFrequency));
		}
	} while (!transaction);
}
