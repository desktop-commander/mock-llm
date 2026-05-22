"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
const express_1 = __importDefault(require("express"));
const jmespath = __importStar(require("jmespath"));
const yaml = __importStar(require("js-yaml"));
const template_1 = require("./template");
const config_logger_1 = require("./config-logger");
const routes_1 = require("./a2a/routes");
const http_server_1 = require("./mcp/http-server");
const oauth_1 = require("./oauth");
const streaming_1 = require("./streaming");
function createServer(initialConfig, host, port) {
    //  Track the current config, which can be changed via '/config' endpoints.
    let currentConfig = { ...initialConfig };
    //  Track request sequence counters per path for sequential matching.
    const sequenceCounters = {};
    //  Create the app, log requests.
    const app = (0, express_1.default)();
    app.use(express_1.default.json({ limit: '50mb' }));
    app.use(express_1.default.text({ type: 'application/x-yaml' }));
    app.use((req, _, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
    // OAuth must be wired before MCP so the Bearer gate runs first.
    (0, oauth_1.setupOAuth)(app, () => currentConfig, { host, port });
    // Setup A2A and MCP routes
    (0, routes_1.setupA2ARoutes)(app, host, port);
    (0, http_server_1.setupHttpMcpServer)(app, host, port);
    // Catch-all for missing A2A agents
    app.use('/a2a/', (req, res, _next) => {
        res.status(404).json({
            error: 'AgentNotFound',
            message: `Agent not found at path: ${req.path}`,
            status: 404
        });
    });
    //  Health and readiness checks
    app.get('/health', (_, res) => {
        res.json({ status: 'healthy' });
    });
    app.get('/ready', (_, res) => {
        res.json({ status: 'ready' });
    });
    //  Handle config requests (get/replace/update/delete).
    app.get('/config', (req, res) => {
        // Return YAML if Accept header requests it, otherwise JSON
        if (req.get('Accept') === 'application/x-yaml') {
            res.type('application/x-yaml').send(yaml.dump(currentConfig));
        }
        else {
            res.json(currentConfig);
        }
    });
    app.post('/config', (req, res) => {
        currentConfig = typeof req.body === 'string'
            ? yaml.load(req.body)
            : req.body;
        (0, config_logger_1.printConfigSummary)(currentConfig, 'config replaced');
        res.json(currentConfig);
    });
    app.patch('/config', (req, res) => {
        const update = typeof req.body === 'string'
            ? yaml.load(req.body)
            : req.body;
        currentConfig = { ...currentConfig, ...update };
        (0, config_logger_1.printConfigSummary)(currentConfig, 'config updated');
        res.json(currentConfig);
    });
    app.delete('/config', (req, res) => {
        currentConfig = { ...initialConfig };
        // Reset sequence counters when config is reset
        Object.keys(sequenceCounters).forEach(key => delete sequenceCounters[key]);
        (0, config_logger_1.printConfigSummary)(currentConfig, 'config reset');
        res.json(currentConfig);
    });
    //  Handle requests via rules matching.
    app.all(/.*/, (req, res, next) => {
        // For GET requests, use empty object; for others, use actual body
        const requestBody = req.method === 'GET' ? {} : (req.body || {});
        const isStreaming = requestBody.stream === true;
        //  Get the current sequence counter for this path.
        const currentSequence = sequenceCounters[req.path] || 0;
        //  Filter rules by path and optionally by method.
        //  Method filtering only applies when a rule explicitly specifies a method.
        //  Rules without a method field match all HTTP methods.
        //  If no rules match, fall through to 404 handler.
        const matchingPathRules = currentConfig.rules.filter(rule => {
            const pathMatches = new RegExp(rule.path).test(req.path);
            const methodMatches = !rule.method || rule.method.toUpperCase() === req.method;
            return pathMatches && methodMatches;
        });
        if (matchingPathRules.length === 0) {
            return next();
        }
        //  Build the request object that will be available to match and template.
        const request = {
            body: requestBody,
            headers: req.headers,
            method: req.method,
            path: req.path,
            query: req.query
        };
        //  Find all rules that match sequence and JMESPath expression.
        //  Rules with sequence must match the current request number.
        //  Rules without sequence match any request number.
        //  If no rules match then we fail.
        const matchingRules = [];
        for (const rule of matchingPathRules) {
            // Check sequence match (if specified)
            if (rule.sequence !== undefined && rule.sequence !== currentSequence) {
                continue;
            }
            // Check JMESPath match (default to '@' which always matches)
            try {
                const matchExpression = rule.match || '@';
                const result = jmespath.search(request, matchExpression);
                if (result) {
                    matchingRules.push(rule);
                }
            }
            catch (error) {
                throw new Error(`Error evaluating match expression: ${rule.match}\n${error}`);
            }
        }
        if (matchingRules.length === 0) {
            return next();
        }
        //  Render the response, expanding any expressions from the matched rule.
        //  Only increment the sequence counter if the winning rule has a sequence.
        //  This allows fallback rules (without sequence) to handle requests like model
        //  liveness probes without consuming sequence numbers meant for actual calls.
        const matchedRule = matchingRules[matchingRules.length - 1];
        if (matchedRule.sequence !== undefined) {
            sequenceCounters[req.path] = currentSequence + 1;
        }
        const body = (0, template_1.renderTemplate)(matchedRule.response.content, { request });
        const parsed = JSON.parse(body);
        // Handle streaming or regular response
        if (isStreaming) {
            return (0, streaming_1.streamResponse)(res, parsed, matchedRule.response.status, currentConfig.streaming);
        }
        else {
            return res.status(matchedRule.response.status).json(parsed);
        }
    });
    // Catch-all 404 handler
    app.use((req, res) => {
        res.status(404).json({
            error: 'Not Found',
            message: `Cannot ${req.method} ${req.path}`,
            status: 404
        });
    });
    // Return JSON errors instead of HTML
    app.use((err, _req, res, _next) => {
        console.error(`Error ${err.status || err.statusCode || 500}: ${err.message}`);
        const status = err.status || err.statusCode || 500;
        res.status(status).json({
            error: err.name || 'Error',
            message: err.message,
            status
        });
    });
    return app;
}
//# sourceMappingURL=server.js.map