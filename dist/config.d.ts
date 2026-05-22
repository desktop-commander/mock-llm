import { OAuthConfig } from './oauth/types';
export { OAuthConfig } from './oauth/types';
export interface Response {
    status: number;
    content: string;
}
export interface Rule {
    path: string;
    method?: string;
    match?: string;
    sequence?: number;
    response: Response;
}
export interface StreamingConfig {
    chunkSize: number;
    chunkIntervalMs: number;
}
export interface Config {
    streaming: StreamingConfig;
    rules: Rule[];
    oauth?: OAuthConfig;
}
export declare function getDefaultConfig(): Config;
export declare function getConfigPath(): string;
export declare function loadConfig(configPath: string): Config;
//# sourceMappingURL=config.d.ts.map