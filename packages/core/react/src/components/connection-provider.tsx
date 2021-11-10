import React, { ReactNode } from 'react';
import { ConnectionContext } from '../hooks/use-connection';

export const ConnectionProvider = React.memo(function ConnectionProvider({
	children,
	endpoint,
}: {
	children: ReactNode;
	endpoint: string;
}) {
	return <ConnectionContext.Provider value={{ endpoint }}>{children}</ConnectionContext.Provider>;
});
