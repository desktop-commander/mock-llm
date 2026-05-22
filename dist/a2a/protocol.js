"use strict";
// A2A Protocol Constants. Currently not exported from the SDK.
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskState = exports.Role = exports.Kind = void 0;
exports.Kind = {
    Message: 'message',
    Task: 'task',
    StatusUpdate: 'status-update',
    Text: 'text',
    File: 'file',
    Data: 'data',
};
exports.Role = {
    User: 'user',
    Agent: 'agent',
};
exports.TaskState = {
    Submitted: 'submitted',
    Working: 'working',
    InputRequired: 'input-required',
    Completed: 'completed',
    Canceled: 'canceled',
    Failed: 'failed',
    Rejected: 'rejected',
    AuthRequired: 'auth-required',
    Unknown: 'unknown',
};
//# sourceMappingURL=protocol.js.map