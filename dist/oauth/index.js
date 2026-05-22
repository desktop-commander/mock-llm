"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupOAuth = setupOAuth;
const router_js_1 = require("@modelcontextprotocol/sdk/server/auth/router.js");
const bearerAuth_js_1 = require("@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js");
const store_1 = require("./store");
const clients_store_1 = require("./clients-store");
const provider_1 = require("./provider");
const control_1 = require("./control");
function resolveIssuer(initialOAuth, host, port) {
    if (initialOAuth?.metadata?.issuerOverride) {
        return new URL(initialOAuth.metadata.issuerOverride);
    }
    const safeHost = host === '0.0.0.0' || host === '::' ? 'localhost' : host;
    return new URL(`http://${safeHost}:${port}/`);
}
function setupOAuth(app, getConfig, options) {
    const clock = options.clock ?? (() => Date.now());
    const store = new store_1.OAuthStore(clock);
    const oauthGetter = () => getConfig().oauth;
    const clientsStore = (0, clients_store_1.createClientsStore)(store, oauthGetter);
    const provider = (0, provider_1.createProvider)(store, clientsStore, oauthGetter);
    const initialOAuth = getConfig().oauth;
    const issuerUrl = resolveIssuer(initialOAuth, options.host, options.port);
    const resourcePath = initialOAuth?.metadata?.resourcePath ?? '/mcp';
    const resourceServerUrl = new URL(resourcePath, issuerUrl);
    const scopesSupported = initialOAuth?.metadata?.scopesSupported ?? ['mcp:read', 'mcp:tools'];
    const resourceName = initialOAuth?.metadata?.resourceName ?? 'Mock MCP Resource';
    const resourceMetadataUrl = new URL(`/.well-known/oauth-protected-resource${resourcePath === '/' ? '' : resourcePath}`, issuerUrl).href;
    // Mount SDK OAuth router (authorize, token, register, well-known). Rate limits disabled
    // for deterministic testing.
    app.use((0, router_js_1.mcpAuthRouter)({
        provider,
        issuerUrl,
        resourceServerUrl,
        scopesSupported,
        resourceName,
        authorizationOptions: { rateLimit: false },
        tokenOptions: { rateLimit: false },
        clientRegistrationOptions: { rateLimit: false, clientIdGeneration: false }
    }));
    // Dynamic Bearer gate: only challenges when current config lists the path.
    const gate = (0, bearerAuth_js_1.requireBearerAuth)({ verifier: provider, resourceMetadataUrl });
    app.use((req, res, next) => {
        const oauth = oauthGetter();
        if (!oauth || oauth.protectedPaths.length === 0)
            return next();
        const matched = oauth.protectedPaths.some(p => {
            try {
                return new RegExp(p).test(req.path);
            }
            catch {
                return false;
            }
        });
        if (!matched)
            return next();
        return gate(req, res, next);
    });
    // Fixture control endpoints.
    app.use('/oauth', (0, control_1.createControlRouter)(store, oauthGetter));
}
//# sourceMappingURL=index.js.map