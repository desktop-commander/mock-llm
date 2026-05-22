"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageCounterAgent = void 0;
const uuid_1 = require("uuid");
const protocol_1 = require("./protocol");
const package_json_1 = __importDefault(require("../../package.json"));
const AgentId = 'message-counter-agent';
const agentCard = {
    name: 'Message Counter Agent',
    description: 'Counts messages received per conversation context',
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
            id: 'count',
            name: 'Count Messages',
            description: 'Tracks and reports message count per context',
            tags: ['counter', 'demo'],
            examples: ['Send a message', 'How many messages'],
            inputModes: ['text/plain'],
            outputModes: ['text/plain'],
        },
    ],
    supportsAuthenticatedExtendedCard: false,
};
//  Track the number of messages per context.
const messageCounts = new Map();
class MessageCounterExecutor {
    async cancelTask(_taskId, _eventBus) {
        // Instant response, nothing to cancel
    }
    async execute(requestContext, eventBus) {
        const { taskId, contextId } = requestContext;
        //  Grab the number of messages, add one for this new incoming message.
        const count = (messageCounts.get(contextId) || 0) + 1;
        messageCounts.set(contextId, count);
        //  Respond with the number of messages received.
        eventBus.publish({
            kind: protocol_1.Kind.Message,
            role: protocol_1.Role.Agent,
            messageId: (0, uuid_1.v4)(),
            parts: [{ kind: protocol_1.Kind.Text, text: `${count} message(s) received` }],
            taskId,
            contextId,
        });
    }
}
exports.messageCounterAgent = {
    id: AgentId,
    card: agentCard,
    executor: new MessageCounterExecutor(),
};
//# sourceMappingURL=message-counter-agent.js.map