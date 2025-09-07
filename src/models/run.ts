import type { Driver, PrepareResponse } from '@/models/driver.ts';
import type { RunInfo } from '@/models/run-info.ts';

export class Run {
    readonly id = crypto.randomUUID();
    startedAt: number | undefined;
    displayedAt: number | undefined;
    reactedAt: number | undefined;
    reactionTime: number | undefined;
    timedOutAt: number | undefined;
    private timeoutId: NodeJS.Timeout | undefined;
    private abort: PrepareResponse['abort'] | undefined;

    get isRunning(): boolean {
        return this.startedAt !== undefined && this.reactedAt === undefined;
    }

    get isAcceptingReactions(): boolean {
        return this.displayedAt !== undefined && this.reactedAt === undefined;
    }

    constructor(
        private readonly delay: number,
        private readonly timeout: number,
        private readonly driver: Driver,
        private readonly onComplete: (run: Run) => void,
    ) {}

    async start(): Promise<void> {
        // console.info(`Starting ${this.id}. Delay: ${this.delay}ms`);
        const { timestamp, reaction, abort } = await this.driver.onPrepare();
        this.startedAt = timestamp;
        reaction
            .then(({ timestamp }) => this.react(timestamp))
            .catch(() => {
                // console.info('Reaction aborted');
            });
        this.abort = abort;
        this.timeoutId = setTimeout(() => this.onDelay(), this.delay);
    }

    cancel(): void {
        // console.info(`Cancelling ${this.id} after: ${performance.now() - (this.startedAt ?? 0)}ms`);
        this.removeDelay();
        this.driver.onCancel();
    }

    react(timestamp: number): void | Promise<void> {
        if (!this.isAcceptingReactions) {
            return this.onError();
        }

        this.removeDelay();
        this.reactedAt = timestamp;
        this.reactionTime = this.reactedAt - (this.displayedAt ?? 0);
        // console.info(`Reacted to ${this.id} after ${this.reactionTime}ms`);
        this.driver.onFinish(this.reactionTime);
        this.onComplete(this);
    }

    getInfo(): RunInfo {
        if (this.timedOutAt !== undefined) {
            return {
                id: this.id,
                status: 'timeout',
            };
        }

        if (this.reactionTime !== undefined) {
            return {
                id: this.id,
                status: 'success',
                reactionTime: this.reactionTime,
            };
        }

        return {
            id: this.id,
            status: 'error',
            reactionTime: (this.reactedAt ?? 0) - ((this.startedAt ?? 0) + this.delay),
        };
    }

    private async onDelay(): Promise<void> {
        this.removeDelay();
        const { timestamp } = await this.driver.onStart();
        this.displayedAt = timestamp;
        // console.info(
        //     `Displayed ${this.id} after ${this.displayedAt - (this.startedAt ?? 0)}ms. Original delay was ${this.delay}ms`,
        // );
        this.timeoutId = setTimeout(() => this.onTimeout(), this.timeout);
    }

    private async onError(): Promise<void> {
        const { timestamp } = await this.driver.onError();
        this.reactedAt = timestamp;
        // console.info(`Error on ${this.id} after ${this.reactedAt - (this.displayedAt ?? 0)}ms`);
        this.removeDelay();
        this.onComplete(this);
    }

    private async onTimeout(): Promise<void> {
        const { timestamp } = await this.driver.onTimeout();
        this.timedOutAt = timestamp;
        // console.info(`Timing out ${this.id} after ${this.timedOutAt - (this.displayedAt ?? 0)}ms`);
        this.abort?.abort();
        this.removeDelay();
        this.onComplete(this);
    }

    private removeDelay(): void {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = undefined;
        }
    }
}
