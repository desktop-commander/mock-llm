"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.currentRequestHeaders = void 0;
exports.setCurrentRequestHeaders = setCurrentRequestHeaders;
// Global headers storage for testing - enables echo_headers tool to access request headers
exports.currentRequestHeaders = {};
// Setter for testing purposes
function setCurrentRequestHeaders(headers) {
    exports.currentRequestHeaders = headers;
}
//# sourceMappingURL=request-context.js.map