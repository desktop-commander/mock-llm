import type { OAuthClientInformationFull } from '@modelcontextprotocol/sdk/shared/auth.js';
import { Clock, OAuthConfig } from './types';
export interface StoredToken {
    accessToken: string;
    refreshToken?: string;
    clientId: string;
    scopes: string[];
    issuedAt: number;
    expiresAt: number;
}
export interface StoredAuthCode {
    code: string;
    clientId: string;
    redirectUri: string;
    codeChallenge: string;
    scopes: string[];
    expiresAt: number;
}
export declare class OAuthStore {
    private clock;
    private tokens;
    private refreshIndex;
    private codes;
    private dynamicClients;
    private accessIdx;
    private refreshIdx;
    private codeIdx;
    private clientIdIdx;
    private clientSecretIdx;
    constructor(clock: Clock);
    private nextDeterministic;
    private randomId;
    getClient(config: OAuthConfig, clientId: string): OAuthClientInformationFull | undefined;
    registerClient(config: OAuthConfig, input: Omit<OAuthClientInformationFull, 'client_id' | 'client_id_issued_at'>): OAuthClientInformationFull;
    issueAuthCode(config: OAuthConfig, params: {
        clientId: string;
        redirectUri: string;
        codeChallenge: string;
        scopes: string[];
    }): StoredAuthCode;
    getAuthCode(code: string): StoredAuthCode | undefined;
    consumeAuthCode(code: string): StoredAuthCode | undefined;
    private evictExpiredCodes;
    issueToken(config: OAuthConfig, clientId: string, scopes: string[]): StoredToken;
    refreshToken(config: OAuthConfig, refreshToken: string): StoredToken | undefined;
    getToken(accessToken: string): StoredToken | undefined;
    isValid(config: OAuthConfig, accessToken: string): boolean;
    revoke(tokenValue: string): void;
    forceExpire(accessToken: string): void;
    reset(): void;
}
//# sourceMappingURL=store.d.ts.map