import type { Config } from '@/models/config.ts';
import type { Driver } from '@/models/driver.ts';
import { Run } from '@/models/run.ts';
import type { RunInfo } from '@/models/run-info.ts';
import { Queue } from '@/utils/queue.ts';

export class Game {
    private readonly history: Queue<RunInfo>;
    private currentRun: Run | undefined;

    constructor(
        private config: Config,
        private readonly driver: Driver,
    ) {
        this.driver.init();
        this.history = new Queue<RunInfo>(this.config.maxHistorySize);
    }

    start(): Promise<void> {
        if (this.currentRun?.isRunning) {
            this.currentRun.cancel();
        }

        this.currentRun = new Run(this.getRandomDelay(), this.config.timeout, this.driver, (run) => {
            this.history.add(run.getInfo());
            this.driver.onHistoryUpdate(this.history);
        });
        return this.currentRun.start();
    }

    private getRandomDelay(): number {
        return Math.floor(Math.random() * (this.config.maxDelay - this.config.minDelay + 1)) + this.config.minDelay;
    }
}
