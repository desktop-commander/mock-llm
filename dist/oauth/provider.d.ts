import type { OAuthServerProvider } from '@modelcontextprotocol/sdk/server/auth/provider.js';
import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import { OAuthStore } from './store';
import { OAuthConfig } from './types';
export declare function createProvider(store: OAuthStore, clientsStore: OAuthRegisteredClientsStore, getConfig: () => OAuthConfig | undefined): OAuthServerProvider;
//# sourceMappingURL=provider.d.ts.map