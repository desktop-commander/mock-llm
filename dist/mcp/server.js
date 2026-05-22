"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMCPServer = getMCPServer;
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const tools_1 = require("./tools");
function getMCPServer() {
    const server = new mcp_js_1.McpServer({
        name: "echo-mcp",
        version: "1.0.0"
    });
    const tools = (0, tools_1.configureTools)(server);
    return { server, name: "echo-mcp", tools };
}
//# sourceMappingURL=server.js.map