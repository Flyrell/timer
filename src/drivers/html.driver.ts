import type { Driver, PrepareResponse, TimestampResponse } from '@/models/driver.ts';
import type { RunInfo } from '@/models/run-info.ts';
import type { Queue } from '@/utils/queue.ts';

export class HtmlDriver implements Driver {
    private clickerEl?: HTMLElement;
    private historyEl?: HTMLElement;
    private averageEl?: HTMLElement;

    init() {
        const { clicker, history, average } = this.createLayout();
        this.clickerEl = clicker;
        this.historyEl = history;
        this.averageEl = average;

        this.updateClicker({
            titleOptions: { text: 'Reaction timer' },
            buttonOptions: { label: 'Start game', onClick: () => globalThis.game.start() },
            bodyOptions: { className: '' },
        });
    }

    async onPrepare() {
        this.updateClicker({
            titleOptions: { text: 'Get ready...', type: 'h2' },
            bodyOptions: { className: 'prepare' },
        });
        await this.wait(2000);
        this.updateClicker({
            titleOptions: { text: 'Click when the background turns blue', type: 'h2' },
            bodyOptions: { className: 'prepare' },
        });

        return new Promise<PrepareResponse>((resolve) => {
            const abort = new AbortController();
            const reaction = new Promise<TimestampResponse>((res, reject) => {
                const onAbort = () => reject(new Error('Aborted'));
                this.clickerEl?.addEventListener(
                    'mousedown',
                    () => {
                        res({ timestamp: performance.now() });
                        abort.signal.removeEventListener('abort', onAbort);
                        abort.abort();
                    },
                    {
                        once: true,
                        signal: abort.signal,
                    },
                );
                this.clickerEl?.addEventListener(
                    'touchstart',
                    () => {
                        res({ timestamp: performance.now() });
                        abort.signal.removeEventListener('abort', onAbort);
                        abort.abort();
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

    onCancel() {
        this.onPrepare();
    }

    onStart() {
        this.updateClicker({
            titleOptions: { text: 'Click now!', type: 'h2' },
            bodyOptions: { className: 'ready' },
        });

        return new Promise<TimestampResponse>((resolve) => {
            requestAnimationFrame(() => {
                resolve({ timestamp: performance.now() });
            });
        });
    }

    onError() {
        this.updateClicker({
            titleOptions: { text: 'Too soon!' },
            buttonOptions: { label: 'Try again', onClick: () => globalThis.game.start(), isError: true },
            bodyOptions: { className: 'error' },
        });

        return new Promise<TimestampResponse>((resolve) => {
            requestAnimationFrame(() => {
                resolve({ timestamp: performance.now() });
            });
        });
    }

    onTimeout() {
        this.updateClicker({
            titleOptions: { text: 'Too slow!' },
            buttonOptions: { label: 'Try again', onClick: () => globalThis.game.start(), isError: true },
            bodyOptions: { className: 'timeout' },
        });

        return new Promise<TimestampResponse>((resolve) => {
            requestAnimationFrame(() => {
                resolve({ timestamp: performance.now() });
            });
        });
    }

    onFinish(reactionTime: number) {
        this.updateClicker({
            titleOptions: { text: `${Math.round(reactionTime * 100) / 100}ms` },
            buttonOptions: { label: 'Try again', onClick: () => globalThis.game.start() },
            bodyOptions: { className: 'success' },
        });
    }

    onHistoryUpdate(history: Queue<RunInfo>) {
        if (!this.historyEl) {
            return;
        }

        let index = 0;
        let sum = 0;
        let divider = 0;
        this.historyEl.innerHTML = '';
        for (const item of history.iterate()) {
            index++;
            if (item.status === 'timeout') {
                this.historyEl.appendChild(this.createListItem(`Game ${index}: Timed-Out`));
                continue;
            }

            if (item.status === 'error') {
                this.historyEl.appendChild(
                    this.createListItem(`Game ${index}: Too Soon (${Math.round(item.reactionTime * 100) / 100}ms)`),
                );
                continue;
            }

            this.historyEl.appendChild(
                this.createListItem(`Game ${index}: ${Math.round(item.reactionTime * 100) / 100}ms`),
            );
            sum += item.reactionTime;
            divider += 1;
        }

        if (!this.averageEl) {
            return;
        }

        const avg = Math.round((sum / divider) * 100) / 100;
        this.averageEl.textContent = avg ? `${avg}ms` : 'N/A';
    }

    private createButton(
        label: string,
        onClick: () => void,
        {
            isError = false,
        }: {
            isError?: boolean;
        } = {},
    ): HTMLButtonElement {
        const button = document.createElement('button');
        button.textContent = label;
        button.addEventListener('click', onClick);

        if (isError) {
            button.classList.add('error');
        }

        return button;
    }

    private createTitle(title: string, type: 'h1' | 'h2' | 'h3' = 'h1'): HTMLHeadingElement {
        const heading = document.createElement(type);
        heading.textContent = title;
        return heading;
    }

    private createListItem(text: string): HTMLLIElement {
        const li = document.createElement('li');
        li.textContent = text;
        return li;
    }

    private wait(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private updateClicker({
        titleOptions,
        buttonOptions,
        bodyOptions,
    }: {
        titleOptions: { text: string; type?: 'h1' | 'h2' };
        buttonOptions?: { label: string; onClick: () => void; isError?: boolean };
        bodyOptions?: { className: string };
    }): void {
        if (!this.clickerEl) {
            return;
        }

        this.clickerEl.innerHTML = '';
        this.clickerEl.append(this.createTitle(titleOptions.text, titleOptions.type));

        if (buttonOptions) {
            this.clickerEl.append(
                this.createButton(buttonOptions.label, buttonOptions.onClick, { isError: buttonOptions.isError }),
            );
        }

        if (bodyOptions) {
            this.clickerEl.className = bodyOptions.className;
        }
    }

    private createLayout(): { clicker: HTMLElement; history: HTMLUListElement; average: HTMLElement } {
        const app = document.createElement('div');
        app.id = 'app';

        const clicker = document.createElement('div');
        clicker.id = 'clicker';
        app.appendChild(clicker);

        const history = document.createElement('div');
        history.id = 'history';
        history.append(this.createTitle('History', 'h3'));

        const list = document.createElement('ul');
        history.append(list);

        const average = document.createElement('div');
        average.id = 'average';

        const span = document.createElement('span');
        span.textContent = 'Average:';
        average.appendChild(span);

        const spanValue = document.createElement('span');
        spanValue.id = 'average-value';
        spanValue.textContent = 'N/A';
        average.appendChild(spanValue);

        history.append(average);

        app.appendChild(history);

        document.body.append(app);

        return { clicker, history: list, average: spanValue };
    }
}
