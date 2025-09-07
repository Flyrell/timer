import type { RunInfo } from '@/models/run-info.ts';
import type { Queue } from '@/utils/queue.ts';

export interface TimestampResponse {
    timestamp: number; // timestamp when the event occurs (in ms)
}

export interface PrepareResponse extends TimestampResponse {
    reaction: Promise<TimestampResponse>;
    abort: AbortController; // function to cancel the reaction listener
}

export interface Driver {
    init(): void;
    onPrepare(): Promise<PrepareResponse>;
    onStart(): Promise<TimestampResponse>;
    onError(): Promise<TimestampResponse>;
    onTimeout(): Promise<TimestampResponse>;
    onFinish(reactionTime: number): void;
    onCancel(): void;
    onHistoryUpdate(history: Queue<RunInfo>): void;
}
