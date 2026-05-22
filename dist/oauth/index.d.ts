import express from 'express';
import { Config } from '../config';
export interface SetupOAuthOptions {
    host: string;
    port: number;
    clock?: () => number;
}
export declare function setupOAuth(app: express.Express, getConfig: () => Config, options: SetupOAuthOptions): void;
//# sourceMappingURL=index.d.ts.map