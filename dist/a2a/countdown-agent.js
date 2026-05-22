"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.countdownAgent = void 0;
const uuid_1 = require("uuid");
const protocol_1 = require("./protocol");
const package_json_1 = __importDefault(require("../../package.json"));
const AgentId = 'countdown-agent';
const agentCard = {
    name: 'Countdown Agent',
    description: 'A simple countdown agent for testing A2A tasks',
    url: '', // Will be set by routes.ts
    provider: {
        organization: 'Mock LLM',
        url: package_json_1.default.repository.url,
    },
    version: package_json_1.default.version,
    protocolVersion: '1.0',
    capabilities: {
        streaming: true,
        pushNotifications: false,
        stateTransitionHistory: true,
    },
    securitySchemes: undefined,
    security: undefined,
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain'],
    skills: [
        {
            id: 'countdown',
            name: 'Countdown',
            description: 'Counts down from a specified number (default 30 seconds)',
            tags: ['countdown', 'timer', 'demo'],
            examples: [
                'Countdown from 30',
                'Start a countdown from 60',
                'Count down from 15 seconds',
            ],
            inputModes: ['text/plain'],
            outputModes: ['text/plain'],
        },
    ],
    supportsAuthenticatedExtendedCard: false,
};
class CountdownAgentExecutor {
    constructor() {
        this.cancelledTasks = new Set();
        this.cancelTask = async (taskId, _eventBus) => {
            this.cancelledTasks.add(taskId);
        };
    }
    async execute(requestContext, eventBus) {
        const userMessage = requestContext.userMessage;
        const existingTask = requestContext.task;
        const taskId = requestContext.taskId;
        const contextId = requestContext.contextId;
        console.log(`[${agentCard.name}] Processing message ${userMessage.messageId} for task ${taskId} (context: ${contextId})`);
        // Publish initial Task event if it's a new task
        if (!existingTask) {
            const initialTask = {
                kind: protocol_1.Kind.Task,
                id: taskId,
                contextId: contextId,
                status: {
                    state: protocol_1.TaskState.Submitted,
                    timestamp: new Date().toISOString(),
                },
                history: [userMessage],
                metadata: userMessage.metadata,
            };
            eventBus.publish(initialTask);
        }
        try {
            // Extract the countdown number from the user message
            const userText = userMessage.parts
                .filter((part) => part.kind === protocol_1.Kind.Text)
                .map((part) => part.text)
                .join(' ');
            // Look for a number in the message (including negative numbers)
            const numberMatch = userText.match(/-?\d+/);
            const countdownFrom = numberMatch ? parseInt(numberMatch[0], 10) : 30;
            console.log(`[${agentCard.name}] Task ${taskId}: Extracted text="${userText}", match="${numberMatch?.[0]}", countdownFrom=${countdownFrom}`);
            // Check for negative number
            if (countdownFrom < 0) {
                const errorUpdate = {
                    kind: protocol_1.Kind.StatusUpdate,
                    taskId: taskId,
                    contextId: contextId,
                    status: {
                        state: protocol_1.TaskState.Failed,
                        message: {
                            kind: protocol_1.Kind.Message,
                            role: protocol_1.Role.Agent,
                            messageId: (0, uuid_1.v4)(),
                            parts: [
                                {
                                    kind: protocol_1.Kind.Text,
                                    text: `Cannot countdown from negative number ${countdownFrom}`,
                                },
                            ],
                            taskId: taskId,
                            contextId: contextId,
                        },
                        timestamp: new Date().toISOString(),
                    },
                    final: true,
                };
                console.log(`[${agentCard.name}] Task ${taskId}: Cannot countdown from negative number ${countdownFrom}`);
                eventBus.publish(errorUpdate);
                return;
            }
            // Publish "working" status update
            const workingStatusUpdate = {
                kind: protocol_1.Kind.StatusUpdate,
                taskId: taskId,
                contextId: contextId,
                status: {
                    state: protocol_1.TaskState.Working,
                    message: {
                        kind: protocol_1.Kind.Message,
                        role: protocol_1.Role.Agent,
                        messageId: (0, uuid_1.v4)(),
                        parts: [
                            {
                                kind: protocol_1.Kind.Text,
                                text: `Starting countdown from ${countdownFrom} seconds...`,
                            },
                        ],
                        taskId: taskId,
                        contextId: contextId,
                    },
                    timestamp: new Date().toISOString(),
                },
                final: false,
            };
            console.log(`[${agentCard.name}] Task ${taskId}: Starting countdown from ${countdownFrom} seconds`);
            eventBus.publish(workingStatusUpdate);
            // Countdown logic
            let current = countdownFrom;
            while (current > 0) {
                // Check if task was cancelled
                if (this.cancelledTasks.has(taskId)) {
                    const cancelledUpdate = {
                        kind: protocol_1.Kind.StatusUpdate,
                        taskId: taskId,
                        contextId: contextId,
                        status: {
                            state: protocol_1.TaskState.Failed,
                            message: {
                                kind: protocol_1.Kind.Message,
                                role: protocol_1.Role.Agent,
                                messageId: (0, uuid_1.v4)(),
                                parts: [{ kind: protocol_1.Kind.Text, text: 'Countdown cancelled' }],
                                taskId: taskId,
                                contextId: contextId,
                            },
                            timestamp: new Date().toISOString(),
                        },
                        final: true,
                    };
                    eventBus.publish(cancelledUpdate);
                    this.cancelledTasks.delete(taskId);
                    return;
                }
                // Determine delay: 10 seconds for >10, 1 second for <=10
                const delay = current > 10 ? 10000 : 1000;
                await new Promise((resolve) => setTimeout(resolve, delay));
                // Decrement appropriately
                if (current > 10) {
                    current = Math.max(10, current - 10);
                }
                else {
                    current--;
                }
                // Publish status update
                const countdownUpdate = {
                    kind: protocol_1.Kind.StatusUpdate,
                    taskId: taskId,
                    contextId: contextId,
                    status: {
                        state: protocol_1.TaskState.Working,
                        message: {
                            kind: protocol_1.Kind.Message,
                            role: protocol_1.Role.Agent,
                            messageId: (0, uuid_1.v4)(),
                            parts: [{ kind: protocol_1.Kind.Text, text: `${current} seconds remaining...` }],
                            taskId: taskId,
                            contextId: contextId,
                        },
                        timestamp: new Date().toISOString(),
                    },
                    final: false,
                };
                console.log(`[${agentCard.name}] Task ${taskId}: ${current} seconds remaining`);
                eventBus.publish(countdownUpdate);
            }
            // Publish final completion status
            const finalUpdate = {
                kind: protocol_1.Kind.StatusUpdate,
                taskId: taskId,
                contextId: contextId,
                status: {
                    state: protocol_1.TaskState.Completed,
                    message: {
                        kind: protocol_1.Kind.Message,
                        role: protocol_1.Role.Agent,
                        messageId: (0, uuid_1.v4)(),
                        parts: [{ kind: protocol_1.Kind.Text, text: 'Countdown complete!' }],
                        taskId: taskId,
                        contextId: contextId,
                    },
                    timestamp: new Date().toISOString(),
                },
                final: true,
            };
            console.log(`[${agentCard.name}] Task ${taskId}: Countdown complete`);
            eventBus.publish(finalUpdate);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[${agentCard.name}] Error processing task ${taskId}:`, error);
            // Handle errors
            const errorUpdate = {
                kind: protocol_1.Kind.StatusUpdate,
                taskId: taskId,
                contextId: contextId,
                status: {
                    state: protocol_1.TaskState.Failed,
                    message: {
                        kind: protocol_1.Kind.Message,
                        role: protocol_1.Role.Agent,
                        messageId: (0, uuid_1.v4)(),
                        parts: [{ kind: protocol_1.Kind.Text, text: `Error: ${errorMessage}` }],
                        taskId: taskId,
                        contextId: contextId,
                    },
                    timestamp: new Date().toISOString(),
                },
                final: true,
            };
            eventBus.publish(errorUpdate);
        }
    }
}
exports.countdownAgent = {
    id: AgentId,
    card: agentCard,
    executor: new CountdownAgentExecutor(),
};
//# sourceMappingURL=countdown-agent.js.map