"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupHttpMcpServer = setupHttpMcpServer;
exports.getStreamableHTTPRouter = getStreamableHTTPRouter;
const node_crypto_1 = require("node:crypto");
const express_1 = __importDefault(require("express"));
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const sse_js_1 = require("@modelcontextprotocol/sdk/server/sse.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const server_1 = require("./server");
const request_context_1 = require("./request-context");
const transports = {};
function setupHttpMcpServer(app, host, port) {
    const mcpInfo = (0, server_1.getMCPServer)();
    console.log('Loaded MCP server:');
    console.log(`  - ${mcpInfo.name}: http://${host}:${port}/mcp`);
    for (const tool of mcpInfo.tools) {
        console.log(`    - ${tool.name}: ${tool.description}`);
    }
    // Streamable HTTP Transport (Protocol 2025-03-26)
    app.use('/mcp', getStreamableHTTPRouter());
    // HTTP+SSE Transport (Protocol 2024-11-05)
    app.get('/sse', sseGetHandler);
    app.post('/messages', sseMessagesHandler);
}
function getStreamableHTTPRouter() {
    const router = express_1.default.Router();
    router.post('/', mcpPostHandler);
    router.get('/', mcpGetHandler);
    router.delete('/', mcpDeleteHandler);
    return router;
}
const mcpPostHandler = async (req, res) => {
    console.log(`Received ${req.method} request to /mcp`);
    // Store headers for echo_headers tool
    (0, request_context_1.setCurrentRequestHeaders)(req.headers);
    try {
        const sessionId = req.headers['mcp-session-id'];
        let transport;
        if (sessionId && transports[sessionId]) {
            const existingTransport = transports[sessionId];
            if (existingTransport instanceof streamableHttp_js_1.StreamableHTTPServerTransport) {
                transport = existingTransport;
            }
            else {
                res.status(400).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32000,
                        message: 'Bad Request: Session exists but uses a different transport protocol'
                    },
                    id: null
                });
                return;
            }
        }
        else if (!sessionId && (0, types_js_1.isInitializeRequest)(req.body)) {
            transport = new streamableHttp_js_1.StreamableHTTPServerTransport({
                sessionIdGenerator: () => (0, node_crypto_1.randomUUID)(),
                onsessioninitialized: sessionId => {
                    console.log(`StreamableHTTP session initialized with ID: ${sessionId}`);
                    transports[sessionId] = transport;
                }
            });
            transport.onclose = () => {
                const sid = transport.sessionId;
                if (sid && transports[sid]) {
                    console.log(`Transport closed for session ${sid}, removing from transports map`);
                    delete transports[sid];
                }
            };
            const mcpServerInfo = (0, server_1.getMCPServer)();
            await mcpServerInfo.server.connect(transport);
        }
        else {
            res.status(400).json({
                jsonrpc: '2.0',
                error: {
                    code: -32000,
                    message: 'Bad Request: No valid session ID provided'
                },
                id: null
            });
            return;
        }
        await transport.handleRequest(req, res, req.body);
    }
    catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: 'Internal server error'
                },
                id: null
            });
        }
    }
};
const mcpGetHandler = async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    if (!sessionId || !transports[sessionId]) {
        res.status(400).send('Invalid or missing Session ID');
        return;
    }
    const transport = transports[sessionId];
    if (!(transport instanceof streamableHttp_js_1.StreamableHTTPServerTransport)) {
        res.status(400).json({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: 'Bad Request: Session exists but uses a different transport protocol'
            },
            id: null
        });
        return;
    }
    await transport.handleRequest(req, res);
};
const mcpDeleteHandler = async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    if (!sessionId || !transports[sessionId]) {
        res.status(400).send('Invalid or missing Session ID');
        return;
    }
    const transport = transports[sessionId];
    if (!(transport instanceof streamableHttp_js_1.StreamableHTTPServerTransport)) {
        res.status(400).json({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: 'Bad Request: Session exists but uses a different transport protocol'
            },
            id: null
        });
        return;
    }
    console.log(`Received session termination request session with ID: ${sessionId}`);
    try {
        await transport.handleRequest(req, res);
    }
    catch (error) {
        console.error('Error handling session termination:', error);
        if (!res.headersSent) {
            res.status(500).send('Error processing session termination');
        }
        /* istanbul ignore next 3 - Headers already sent error path is hard to test */
    }
};
// HTTP+SSE Transport Handlers (Protocol 2024-11-05)
const sseGetHandler = async (req, res) => {
    console.log('Received GET request to /sse (HTTP+SSE transport)');
    const transport = new sse_js_1.SSEServerTransport('/messages', res);
    transports[transport.sessionId] = transport;
    // Set session ID in headers for client access
    res.setHeader('mcp-session-id', transport.sessionId);
    res.on('close', () => {
        delete transports[transport.sessionId];
    });
    const serverInfo = (0, server_1.getMCPServer)();
    await serverInfo.server.connect(transport);
};
const sseMessagesHandler = async (req, res) => {
    // Store headers for echo_headers tool
    (0, request_context_1.setCurrentRequestHeaders)(req.headers);
    const sessionId = req.query.sessionId;
    let transport;
    const existingTransport = transports[sessionId];
    if (existingTransport instanceof sse_js_1.SSEServerTransport) {
        transport = existingTransport;
    }
    else {
        res.status(400).json({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: 'Bad Request: Session exists but uses a different transport protocol'
            },
            id: null
        });
        return;
    }
    if (transport) {
        await transport.handlePostMessage(req, res, req.body);
    }
    else {
        /* istanbul ignore next 1 - Unreachable else branch after instanceof check */
        res.status(400).send('No transport found for sessionId');
    }
};
//# sourceMappingURL=http-server.js.map