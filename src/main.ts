import { HtmlDriver } from '@/drivers/html.driver.ts';
import { Game } from '@/game.ts';
import type { Config } from '@/models/config.ts';

declare global {
    var game: Game;
}

import.meta.hot.accept();

const config: Config = {
    minDelay: 2000,
    maxDelay: 7000,
    timeout: 5000,
};

const driver = new HtmlDriver();
globalThis.game = new Game(config, driver);
