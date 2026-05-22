"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createControlRouter = createControlRouter;
const express_1 = __importDefault(require("express"));
function createControlRouter(store, getConfig) {
    const router = express_1.default.Router();
    router.use(express_1.default.json());
    router.post('/revoke', (req, res) => {
        const token = typeof req.body?.token === 'string' ? req.body.token : undefined;
        const refreshToken = typeof req.body?.refresh_token === 'string' ? req.body.refresh_token : undefined;
        const target = token ?? refreshToken;
        if (!target) {
            res.status(400).json({ error: 'token or refresh_token required' });
            return;
        }
        store.revoke(target);
        res.status(204).send();
    });
    router.post('/expire', (req, res) => {
        const token = typeof req.body?.token === 'string' ? req.body.token : undefined;
        if (!token) {
            res.status(400).json({ error: 'token required' });
            return;
        }
        store.forceExpire(token);
        res.status(204).send();
    });
    router.post('/reset', (_req, res) => {
        store.reset();
        res.status(204).send();
    });
    router.post('/issue', (req, res) => {
        const config = getConfig();
        if (!config) {
            res.status(409).json({ error: 'oauth not configured' });
            return;
        }
        const clientId = typeof req.body?.clientId === 'string' ? req.body.clientId : undefined;
        if (!clientId) {
            res.status(400).json({ error: 'clientId required' });
            return;
        }
        const scopes = typeof req.body?.scope === 'string' ? req.body.scope.split(' ').filter(Boolean) : [];
        const issued = store.issueToken(config, clientId, scopes);
        res.status(200).json({
            access_token: issued.accessToken,
            token_type: 'Bearer',
            expires_in: Math.max(0, Math.floor((issued.expiresAt - issued.issuedAt) / 1000)),
            refresh_token: issued.refreshToken,
            scope: scopes.join(' ') || undefined
        });
    });
    return router;
}
//# sourceMappingURL=control.js.map