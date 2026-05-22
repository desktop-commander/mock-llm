import express from 'express';
import { OAuthStore } from './store';
import { OAuthConfig } from './types';
export declare function createControlRouter(store: OAuthStore, getConfig: () => OAuthConfig | undefined): express.Router;
//# sourceMappingURL=control.d.ts.map