import type { Driver, PrepareResponse, TimestampResponse } from '@/models/driver.ts';

export class HtmlDriver implements Driver {
    constructor() {
        document.body.innerHTML = '';
        document.body.append(this.createTitle('Reaction timer'));
        document.body.append(this.createButton('Start game', () => globalThis.game.start()));
    }

    onPrepare() {
        document.body.innerHTML = '';
        document.body.append(this.createTitle('Click when background turns green'));
        document.body.className = 'prepare';

        return new Promise<PrepareResponse>((resolve) => {
            const abort = new AbortController();
            const reaction = new Promise<TimestampResponse>((res, reject) => {
                const onAbort = () => reject(new Error('Aborted'));
                document.body.addEventListener(
                    'mousedown',
                    () => {
                        res({ timestamp: performance.now() });
                        abort.signal.removeEventListener('abort', onAbort);
                    },
                    {
                        once: true,
                        signal: abort.signal,
                    },
                );
                abort.signal.addEventListener('abort', onAbort, { once: true });
            });

            requestAnimationFrame(() => {
                resolve({
                    abort,
                    reaction,
                    timestamp: performance.now(),
                });
            });
        });
    }

    onCancel(): void {
        this.onPrepare();
    }

    onStart() {
        document.body.innerHTML = '';
        document.body.append(this.createTitle('Click now!'));
        document.body.className = 'ready';

        return new Promise<TimestampResponse>((resolve) => {
            requestAnimationFrame(() => {
                resolve({ timestamp: performance.now() });
            });
        });
    }

    onError(): Promise<TimestampResponse> {
        document.body.innerHTML = '';
        document.body.append(this.createTitle('Too soon!'));
        document.body.append(this.createButton('Try again', () => globalThis.game.start()));
        document.body.className = 'error';

        return new Promise<TimestampResponse>((resolve) => {
            requestAnimationFrame(() => {
                resolve({ timestamp: performance.now() });
            });
        });
    }

    onTimeout() {
        document.body.innerHTML = '';
        document.body.append(this.createTitle('Too slow!'));
        document.body.append(this.createButton('Try again', () => globalThis.game.start()));
        document.body.className = 'timeout';

        return new Promise<TimestampResponse>((resolve) => {
            requestAnimationFrame(() => {
                resolve({ timestamp: performance.now() });
            });
        });
    }

    onFinish(reactionTime: number): void {
        document.body.innerHTML = '';
        document.body.append(this.createTitle(`${Math.round(reactionTime)}ms`));
        document.body.append(this.createButton('Try again', () => globalThis.game.start()));
        document.body.className = 'success';
    }

    private createButton(label: string, onClick: () => void): HTMLButtonElement {
        const button = document.createElement('button');
        button.textContent = label;
        button.classList.add('button');
        button.addEventListener('click', onClick);
        return button;
    }

    private createTitle(title: string): HTMLHeadingElement {
        const heading = document.createElement('h1');
        heading.textContent = title;
        heading.classList.add('title');
        return heading;
    }
}
