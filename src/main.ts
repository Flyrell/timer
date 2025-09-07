import { HtmlDriver } from '@/drivers/html.driver.ts';
import { Game } from '@/game.ts';
import type { Config } from '@/models/config.ts';

import.meta.hot.accept();

const config: Config = {
    minDelay: 2000,
    maxDelay: 7000,
    timeout: 1500,
    maxHistorySize: 20,
};

const driver = new HtmlDriver();
globalThis.game = new Game(config, driver);
