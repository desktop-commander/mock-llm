"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printConfigSummary = printConfigSummary;
function printConfigSummary(config, message) {
    console.log(message);
    config.rules.forEach((rule, index) => {
        console.log(`  - rule ${index + 1}, match: ${rule.match}`);
    });
}
//# sourceMappingURL=config-logger.js.map