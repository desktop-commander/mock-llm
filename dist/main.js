#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const config_1 = require("./config");
const config_logger_1 = require("./config-logger");
const package_json_1 = __importDefault(require("../package.json"));
const HOST = process.env.HOST || '0.0.0.0';
const PORT = parseInt(process.env.PORT || '6556', 10);
// Parse --config argument
const configArgIndex = process.argv.indexOf('--config');
const configPath = configArgIndex !== -1 ? process.argv[configArgIndex + 1] : (0, config_1.getConfigPath)();
const config = (0, config_1.loadConfig)(configPath);
(0, config_logger_1.printConfigSummary)(config, `Loaded configuration from ${configPath}`);
const app = (0, server_1.createServer)(config, HOST, PORT);
app.listen(PORT, HOST, () => {
    console.log(`${package_json_1.default.name} v${package_json_1.default.version} server running on ${HOST}:${PORT}`);
}).on('error', (err) => { console.error(err); process.exit(1); });
//# sourceMappingURL=main.js.map