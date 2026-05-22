"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthStore = void 0;
const node_crypto_1 = require("node:crypto");
const DEFAULT_EXPIRES_IN = 3600;
const CODE_TTL_MS = 10 * 60 * 1000;
class OAuthStore {
    constructor(clock) {
        this.clock = clock;
        this.tokens = new Map();
        this.refreshIndex = new Map();
        this.codes = new Map();
        this.dynamicClients = new Map();
        this.accessIdx = 0;
        this.refreshIdx = 0;
        this.codeIdx = 0;
        this.clientIdIdx = 0;
        this.clientSecretIdx = 0;
    }
    nextDeterministic(queue, idxKey) {
        if (!queue)
            return undefined;
        const i = this[idxKey];
        if (i >= queue.length)
            return undefined;
        this[idxKey] = i + 1;
        return queue[i];
    }
    randomId() {
        return (0, node_crypto_1.randomBytes)(16).toString('hex');
    }
    getClient(config, clientId) {
        const seeded = config.clients?.find(c => c.clientId === clientId);
        if (seeded) {
            return {
                client_id: seeded.clientId,
                client_secret: seeded.clientSecret,
                redirect_uris: seeded.redirectUris,
                scope: seeded.scope,
                token_endpoint_auth_method: seeded.clientSecret ? 'client_secret_post' : 'none'
            };
        }
        return this.dynamicClients.get(clientId);
    }
    registerClient(config, input) {
        const isPublic = input.token_endpoint_auth_method === 'none';
        const clientId = this.nextDeterministic(config.tokens?.deterministic?.nextClientIds, 'clientIdIdx') ?? this.randomId();
        const clientSecret = isPublic
            ? undefined
            : (input.client_secret ?? this.nextDeterministic(config.tokens?.deterministic?.nextClientSecrets, 'clientSecretIdx') ?? this.randomId());
        const info = {
            ...input,
            client_id: clientId,
            client_secret: clientSecret,
            client_id_issued_at: Math.floor(this.clock() / 1000),
            client_secret_expires_at: isPublic ? undefined : 0
        };
        this.dynamicClients.set(clientId, info);
        return info;
    }
    issueAuthCode(config, params) {
        const code = this.nextDeterministic(config.tokens?.deterministic?.nextAuthorizationCodes, 'codeIdx') ?? this.randomId();
        const entry = {
            code,
            clientId: params.clientId,
            redirectUri: params.redirectUri,
            codeChallenge: params.codeChallenge,
            scopes: params.scopes,
            expiresAt: this.clock() + CODE_TTL_MS
        };
        this.codes.set(code, entry);
        return entry;
    }
    getAuthCode(code) {
        this.evictExpiredCodes();
        return this.codes.get(code);
    }
    consumeAuthCode(code) {
        this.evictExpiredCodes();
        const entry = this.codes.get(code);
        if (!entry)
            return undefined;
        this.codes.delete(code);
        if (entry.expiresAt < this.clock())
            return undefined;
        return entry;
    }
    evictExpiredCodes() {
        const now = this.clock();
        for (const [code, entry] of this.codes) {
            if (entry.expiresAt < now) {
                this.codes.delete(code);
            }
        }
    }
    issueToken(config, clientId, scopes) {
        const expiresIn = config.tokens?.expiresInSeconds ?? DEFAULT_EXPIRES_IN;
        const refreshable = config.tokens?.refreshable ?? true;
        const accessToken = this.nextDeterministic(config.tokens?.deterministic?.nextAccessTokens, 'accessIdx') ?? this.randomId();
        const refreshToken = refreshable
            ? (this.nextDeterministic(config.tokens?.deterministic?.nextRefreshTokens, 'refreshIdx') ?? this.randomId())
            : undefined;
        const now = this.clock();
        const token = {
            accessToken,
            refreshToken,
            clientId,
            scopes,
            issuedAt: now,
            expiresAt: now + expiresIn * 1000
        };
        this.tokens.set(accessToken, token);
        if (refreshToken) {
            this.refreshIndex.set(refreshToken, accessToken);
        }
        return token;
    }
    refreshToken(config, refreshToken) {
        const accessToken = this.refreshIndex.get(refreshToken);
        if (!accessToken)
            return undefined;
        const existing = this.tokens.get(accessToken);
        if (!existing) {
            this.refreshIndex.delete(refreshToken);
            return undefined;
        }
        const rotate = config.tokens?.rotateRefreshToken ?? false;
        this.tokens.delete(existing.accessToken);
        if (rotate) {
            this.refreshIndex.delete(refreshToken);
        }
        const next = this.issueToken(config, existing.clientId, existing.scopes);
        if (!rotate && next.refreshToken) {
            this.refreshIndex.delete(next.refreshToken);
            this.tokens.delete(next.accessToken);
            const reused = { ...next, refreshToken };
            this.tokens.set(reused.accessToken, reused);
            this.refreshIndex.set(refreshToken, reused.accessToken);
            return reused;
        }
        return next;
    }
    getToken(accessToken) {
        return this.tokens.get(accessToken);
    }
    isValid(config, accessToken) {
        const t = this.tokens.get(accessToken);
        if (!t)
            return false;
        if (config.tokens?.revoked?.includes(accessToken))
            return false;
        if (config.tokens?.expired?.includes(accessToken))
            return false;
        if (t.expiresAt < this.clock())
            return false;
        return true;
    }
    revoke(tokenValue) {
        if (this.tokens.has(tokenValue)) {
            const t = this.tokens.get(tokenValue);
            this.tokens.delete(tokenValue);
            if (t.refreshToken)
                this.refreshIndex.delete(t.refreshToken);
            return;
        }
        const access = this.refreshIndex.get(tokenValue);
        if (access) {
            this.refreshIndex.delete(tokenValue);
            this.tokens.delete(access);
        }
    }
    forceExpire(accessToken) {
        const t = this.tokens.get(accessToken);
        if (!t)
            return;
        t.expiresAt = this.clock() - 1;
    }
    reset() {
        this.tokens.clear();
        this.refreshIndex.clear();
        this.codes.clear();
        this.dynamicClients.clear();
        this.accessIdx = 0;
        this.refreshIdx = 0;
        this.codeIdx = 0;
        this.clientIdIdx = 0;
        this.clientSecretIdx = 0;
    }
}
exports.OAuthStore = OAuthStore;
//# sourceMappingURL=store.js.map