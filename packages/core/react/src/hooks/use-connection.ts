import { createContext, useContext } from 'react';

export interface ConnectionContextState {
	endpoint: string;
}

export const ConnectionContext = createContext<ConnectionContextState>({} as ConnectionContextState);

export function useConnection(): ConnectionContextState {
	return useContext(ConnectionContext);
}
