import Game from '../Game';
import { AssetList, AssetManager, SoundManager, StageManager } from '..';
import { AssetCache } from '../assets/AssetManager';
import Tween, { Ease } from '../tween/Tween';
import PauseableTimer from '../timer/PauseableTimer';
import { Application } from 'springroll';
import { Container } from 'pixi-animate';
import { Point } from '@pixi/math';
/**
 * Generic Scene base class, parent container for all art and functionality in a given scene
 */
export default class Scene extends Container {
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
    protected readonly stageManager: StageManager;
    /** Object reference to Game's SpringRoll Application, interface to Container */
    protected readonly app: Application;
    constructor(game: Game);
    /**
     * Provide list of assets to preload.
     * Optionally, return a Promise which may return a list of assets to preload.
     * @returns {AssetList | Promise<AssetList>}
     */
    preload(): AssetList | Promise<AssetList>;
    /**
     * Exit this Scene and transition to specified scene
     * @param {string} sceneID ID of Scene to transition to
     */
    changeScene(sceneID: string): void;
    /**
     * Prepare initial visual state - called after preload is complete, while scene is obscured by loader.
     * Optionally return a Promise, which will delay removal of the loader until it is resolved.
     * @returns {Promise<any> | void}
     */
    setup(): Promise<any> | void;
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
     * @param {number} deltaTime time since last frame in milliseconds.
     */
    update(deltaTime: number): void;
    /**
     * Simple tween target's numeric properties to specified values over time with easinbg
     * @param target object with values to tween
     * @param values numeric end values of tweening target, keyed by target property names
     * @param time number of frames over which to tween target values
     * @param [ease] name of easing curve to apply to tween
     * @returns {Tween} instance of Tween, for pausing/cancelling
     */
    tween(target: any, values: any, time: number, ease?: Ease): Tween;
    /**
     *
     * Replacement for the window.setTimeout, this timeout will pause when the game is paused.
     * Similar to Tween
     *
     * @param callback
     * @param time
     */
    setTimeout(callback: Function, time: number): PauseableTimer;
    clearTimeout(timer: PauseableTimer): void;
    setInterval(callback: Function, time: number): PauseableTimer;
    clearInterval(timer: PauseableTimer): void;
    resize(width: number, height: number, offset: Point): void;
    /**
     * Called when Scene is about to transition out - override to clean up art or other objects in memory
     * @returns {void} return a Promise to resolve when any asynchronous cleanup is complete
     */
    cleanup(): void;
}
