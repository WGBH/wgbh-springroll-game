/// <reference types="pixi.js" />
import Game from '../Game';
import { AssetList, AssetManager, SoundManager } from '..';
import { AssetCache } from '../assets/AssetManager';
/**
 * Generic Scene base class, parent container for all art and functionality in a given scene
 */
export default class Scene extends PIXI.Container {
    /** Object containing references to cached instances of assets loaded by the AssetManager */
    protected readonly cache: AssetCache;
    /** Object for storing any data (such as state or progress) which needs to persist beyone a single Scene */
    protected readonly dataStore: {
        [key: string]: any;
    };
    /** interface for playing back and controlling sounds */
    protected readonly sound: SoundManager;
    /**
     * Manages loading and unloading of assets.
     * Should not be controlled directly by a game Scene except in advanced use cases.
     */
    protected readonly assetManager: AssetManager;
    /** Manages transitioning between Scenes - not intended to be controlled directly by a game Scene */
    private readonly stageManager;
    constructor(game: Game);
    /**
     * provide list of assets to preload
     * @returns {AssetList}
     */
    preload(): AssetList;
    /**
     * Exit this Scene and transition to specified scene
     * @param {string} sceneID ID of Scene to transition to
     */
    changeScene(sceneID: string): void;
    /**
     * prepare initial visual state - called after preload is complete, while scene is obscured by loader
     */
    setup(): void;
    /**
     * entrypoint to scene - called after loader transition is complete
     */
    start(): void;
    /**
     * pause scene - override this if you need to pause functionality of your scene
     * when the rendering and sound is paused
     * @param paused whether or not the game is being paused (false if being resumed)
     */
    pause(paused: boolean): void;
    /**
     * callback for frame ticks
     * @param {number} deltaTime time since last frame in multiples of one frame's length of time.
     */
    update(deltaTime: number): void;
    /**
     * Called when Scene is about to transition out - override to clean up art or other objects in memory
     * @returns {void} return a Promise to resolve when any asynchronous cleanup is complete
     */
    cleanup(): void;
}
