"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClientsStore = createClientsStore;
function createClientsStore(store, getConfig) {
    return {
        getClient(clientId) {
            const config = getConfig();
            if (!config)
                return undefined;
            return store.getClient(config, clientId);
        },
        registerClient(input) {
            const config = getConfig();
            if (!config) {
                throw new Error('OAuth not configured');
            }
            return store.registerClient(config, input);
        }
    };
}
//# sourceMappingURL=clients-store.js.map