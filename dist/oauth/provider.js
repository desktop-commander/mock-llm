"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProvider = createProvider;
const errors_js_1 = require("@modelcontextprotocol/sdk/server/auth/errors.js");
function createProvider(store, clientsStore, getConfig) {
    const requireConfig = () => {
        const c = getConfig();
        if (!c) {
            throw new errors_js_1.ServerError('OAuth not configured');
        }
        return c;
    };
    const toTokens = (t) => ({
        access_token: t.accessToken,
        token_type: 'Bearer',
        expires_in: Math.max(0, Math.floor((t.expiresAt - t.issuedAt) / 1000)),
        refresh_token: t.refreshToken,
        scope: t.scopes.join(' ') || undefined
    });
    return {
        get clientsStore() { return clientsStore; },
        async authorize(client, params, res) {
            const config = requireConfig();
            const entry = store.issueAuthCode(config, {
                clientId: client.client_id,
                redirectUri: params.redirectUri,
                codeChallenge: params.codeChallenge,
                scopes: params.scopes ?? []
            });
            const redirect = new URL(params.redirectUri);
            redirect.searchParams.set('code', entry.code);
            if (params.state) {
                redirect.searchParams.set('state', params.state);
            }
            res.redirect(302, redirect.href);
        },
        async challengeForAuthorizationCode(client, authorizationCode) {
            const entry = store.getAuthCode(authorizationCode);
            if (!entry || entry.clientId !== client.client_id) {
                throw new errors_js_1.InvalidGrantError('Unknown or mismatched authorization code');
            }
            return entry.codeChallenge;
        },
        async exchangeAuthorizationCode(client, authorizationCode, _codeVerifier, redirectUri) {
            const config = requireConfig();
            const entry = store.consumeAuthCode(authorizationCode);
            if (!entry) {
                throw new errors_js_1.InvalidGrantError('Authorization code is invalid or expired');
            }
            if (entry.clientId !== client.client_id) {
                throw new errors_js_1.InvalidGrantError('Authorization code was issued to a different client');
            }
            if (redirectUri !== undefined && redirectUri !== entry.redirectUri) {
                throw new errors_js_1.InvalidGrantError('redirect_uri does not match the original request');
            }
            const issued = store.issueToken(config, client.client_id, entry.scopes);
            return toTokens(issued);
        },
        async exchangeRefreshToken(client, refreshToken) {
            const config = requireConfig();
            if (config.tokens?.refreshable === false) {
                throw new errors_js_1.InvalidGrantError('Refresh tokens are disabled');
            }
            const issued = store.refreshToken(config, refreshToken);
            if (!issued) {
                throw new errors_js_1.InvalidGrantError('Refresh token is invalid or expired');
            }
            if (issued.clientId !== client.client_id) {
                throw new errors_js_1.InvalidGrantError('Refresh token was issued to a different client');
            }
            return toTokens(issued);
        },
        async verifyAccessToken(token) {
            const config = requireConfig();
            if (!store.isValid(config, token)) {
                throw new errors_js_1.InvalidTokenError('Token is invalid, revoked, or expired');
            }
            const stored = store.getToken(token);
            return {
                token,
                clientId: stored.clientId,
                scopes: stored.scopes,
                expiresAt: Math.floor(stored.expiresAt / 1000)
            };
        }
    };
}
//# sourceMappingURL=provider.js.map