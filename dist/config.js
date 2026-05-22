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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultConfig = getDefaultConfig;
exports.getConfigPath = getConfigPath;
exports.loadConfig = loadConfig;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const yaml = __importStar(require("js-yaml"));
function getDefaultConfig() {
    return {
        streaming: {
            chunkSize: 50,
            chunkIntervalMs: 50
        },
        rules: [
            {
                path: '/v1/chat/completions',
                method: 'POST',
                match: '@',
                response: {
                    status: 200,
                    content: `{
  "id": "chatcmpl-{{timestamp}}",
  "object": "chat.completion",
  "model": "{{jmes request body.model}}",
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "{{jmes request body.messages[-1].content}}"
    },
    "finish_reason": "stop"
  }]
}`
                }
            },
            {
                path: '/v1/models',
                method: 'GET',
                response: {
                    status: 200,
                    content: `{
  "object": "list",
  "data": [
    {"id": "gpt-5.2", "object": "model", "owned_by": "openai"}
  ]
}`
                }
            }
        ]
    };
}
function getConfigPath() {
    return path.join(process.cwd(), 'mock-llm.yaml');
}
function loadConfig(configPath) {
    const defaultConfig = getDefaultConfig();
    if (!fs.existsSync(configPath)) {
        return defaultConfig;
    }
    const configContent = fs.readFileSync(configPath, 'utf8');
    const loadedConfig = yaml.load(configContent);
    return {
        ...defaultConfig,
        ...loadedConfig
    };
}
//# sourceMappingURL=config.js.map