"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.echoAgent = void 0;
const uuid_1 = require("uuid");
const protocol_1 = require("./protocol");
const package_json_1 = __importDefault(require("../../package.json"));
const AgentId = 'echo-agent';
const agentCard = {
    name: 'Echo Agent',
    description: 'Echoes back user messages',
    url: '',
    provider: {
        organization: 'Mock LLM',
        url: package_json_1.default.repository.url,
    },
    version: package_json_1.default.version,
    protocolVersion: '1.0',
    capabilities: {
        streaming: false,
        pushNotifications: false,
        stateTransitionHistory: true,
    },
    securitySchemes: undefined,
    security: undefined,
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain'],
    skills: [
        {
            id: 'echo',
            name: 'Echo',
            description: 'Echoes back user messages',
            tags: ['echo', 'demo'],
            examples: ['Hello!', 'Test message'],
            inputModes: ['text/plain'],
            outputModes: ['text/plain'],
        },
    ],
    supportsAuthenticatedExtendedCard: false,
};
class EchoAgentExecutor {
    async cancelTask(_taskId, _eventBus) {
        // Echo is instant, nothing to cancel
    }
    async execute(requestContext, eventBus) {
        const { userMessage, taskId, contextId } = requestContext;
        // Extract user text
        const userText = userMessage.parts
            .filter((part) => part.kind === protocol_1.Kind.Text)
            .map((part) => part.text)
            .join(' ');
        // Simple response: just publish a Message directly
        eventBus.publish({
            kind: protocol_1.Kind.Message,
            role: protocol_1.Role.Agent,
            messageId: (0, uuid_1.v4)(),
            parts: [{ kind: protocol_1.Kind.Text, text: userText }],
            taskId,
            contextId,
        });
    }
}
exports.echoAgent = {
    id: AgentId,
    card: agentCard,
    executor: new EchoAgentExecutor(),
};
//# sourceMappingURL=echo-agent.js.map