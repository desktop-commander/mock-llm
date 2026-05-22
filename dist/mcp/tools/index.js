"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureTools = configureTools;
const zod_1 = require("zod");
const request_context_1 = require("../request-context");
function configureTools(server) {
    const tools = [];
    server.tool('echo', 'echoes back the provided request', {
        text: zod_1.z.string().describe('the text to echo back'),
    }, async ({ text }) => {
        return {
            content: [
                {
                    type: 'text',
                    text: text
                }
            ]
        };
    });
    tools.push({ name: 'echo', description: 'echoes back the provided request' });
    server.tool('echo_headers', 'returns HTTP headers as JSON', {}, async () => {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(request_context_1.currentRequestHeaders)
                }
            ]
        };
    });
    tools.push({ name: 'echo_headers', description: 'returns HTTP headers as JSON' });
    return tools;
}
//# sourceMappingURL=index.js.map