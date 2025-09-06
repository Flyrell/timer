export interface TimestampResponse {
    timestamp: number; // timestamp when the event occurs (in ms)
}

export interface PrepareResponse extends TimestampResponse {
    reaction: Promise<TimestampResponse>;
    abort: AbortController; // function to cancel the reaction listener
}

export interface Driver {
    onPrepare(): Promise<PrepareResponse>;
    onStart(): Promise<TimestampResponse>;
    onError(): Promise<TimestampResponse>;
    onTimeout(): Promise<TimestampResponse>;
    onFinish(reactionTime: number): void;
    onCancel(): void;
}
