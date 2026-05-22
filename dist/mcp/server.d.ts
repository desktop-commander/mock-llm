import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ToolInfo } from './tools';
export interface MCPServerInfo {
    server: McpServer;
    name: string;
    tools: ToolInfo[];
}
export declare function getMCPServer(): MCPServerInfo;
//# sourceMappingURL=server.d.ts.map