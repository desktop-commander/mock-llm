import type { Response } from 'express';
import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import { OAuthStore } from './store';
import { OAuthConfig } from './types';
export declare function createClientsStore(store: OAuthStore, getConfig: () => OAuthConfig | undefined): OAuthRegisteredClientsStore;
export { Response };
//# sourceMappingURL=clients-store.d.ts.map