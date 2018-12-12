/// <reference types="pixi.js" />
import Game from '../Game';
/**
 * Generic Scene base class
 */
export default class Scene extends PIXI.Container {
    game: Game;
    constructor(game: Game);
    /**
     * asynchronous load tasks
     * @returns {Promise}
     */
    preload(): Promise<any>;
    /**
     * prepare initial visual state - called after preload is complete, while scene is obscured by loader
     */
    setup(): void;
    /**
     * entrypoint to scene - called after loader transition is complete
     */
    start(): void;
    /**
     * callback for frame ticks
     * @param {number} deltaTime time since last frame in multiples of one frame's length of time.
     */
    update(deltaTime: number): void;
    cleanup(): Promise<any> | void;
}
