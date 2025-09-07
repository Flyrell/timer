export interface Config {
    // all times are in milliseconds
    minDelay: number;
    maxDelay: number;
    timeout: number;

    maxHistorySize: number;
}
