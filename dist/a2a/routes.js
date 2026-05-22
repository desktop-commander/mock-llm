"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupA2ARoutes = setupA2ARoutes;
const express_1 = __importDefault(require("express"));
const server_1 = require("@a2a-js/sdk/server");
const express_2 = require("@a2a-js/sdk/server/express");
const countdown_agent_1 = require("./countdown-agent");
const echo_agent_1 = require("./echo-agent");
const message_counter_agent_1 = require("./message-counter-agent");
const agents = [countdown_agent_1.countdownAgent, echo_agent_1.echoAgent, message_counter_agent_1.messageCounterAgent];
function setupA2ARoutes(app, host, port) {
    // Use env vars for agent card URL if provided, otherwise use actual host/port
    const cardHost = process.env.AGENT_CARD_HOST || host;
    const cardPort = process.env.AGENT_CARD_PORT || port.toString();
    console.log('Loaded A2A agents:');
    for (const agent of agents) {
        // Patch the agent card URL with configured host/port
        const agentCardWithUrl = {
            ...agent.card,
            url: `http://${cardHost}:${cardPort}/a2a/agents/${agent.id}`,
        };
        // Create task store and request handler
        const taskStore = new server_1.InMemoryTaskStore();
        const requestHandler = new server_1.DefaultRequestHandler(agentCardWithUrl, taskStore, agent.executor);
        // Create A2A Express app
        const a2aApp = new express_2.A2AExpressApp(requestHandler);
        // Create a sub-app for the agent
        const agentApp = (0, express_1.default)();
        a2aApp.setupRoutes(agentApp);
        // Mount the agent app at the agent-specific path
        app.use(`/a2a/agents/${agent.id}`, agentApp);
        console.log(`  - ${agent.id}: http://${host}:${port}/a2a/agents/${agent.id}/.well-known/agent-card.json`);
    }
}
//# sourceMappingURL=routes.js.map