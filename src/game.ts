import type { Config } from '@/models/config.ts';
import type { Driver } from '@/models/driver.ts';
import { Run } from '@/models/run.ts';

export class Game {
    private currentRun: Run | undefined;

    constructor(
        private config: Config,
        private readonly driver: Driver,
    ) {}

    start(): Promise<void> {
        if (this.currentRun?.isRunning) {
            this.currentRun.cancel();
        }

        this.currentRun = new Run(this.getRandomDelay(), this.config.timeout, this.driver);
        return this.currentRun.start();
    }

    private getRandomDelay(): number {
        return Math.floor(Math.random() * (this.config.maxDelay - this.config.minDelay + 1)) + this.config.minDelay;
    }
}
