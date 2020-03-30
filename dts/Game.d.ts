import * as SpringRoll from 'springroll';
import AssetManager, { AnimateStage, AssetCache, AssetList } from "./assets/AssetManager";
import StageManager from "./scenes/StageManager";
import SoundManager from './sound/SoundManager';
import { Scene } from '.';
import { ApplicationPlugin } from 'springroll';
/** Base Class for WGBH SpringRoll Games - extend this Class in your project */
export default class Game {
    /** SpringRoll Application, interface to Container */
    app: SpringRoll.Application;
    /** Asset Manager, for loading, caching, and unloading of assets */
    assetManager: AssetManager;
    /** Object containing references to instances of cached assets */
    cache: AssetCache;
    /** Stage Manager, for managing Scenes, transitions, and renderer */
    stageManager: StageManager;
    /** Sound Manager, for controlling Playback, pausing/resuming, and volume of Sounds */
    sound: SoundManager;
    /** object for storing global data - accessible from all Scenes */
    dataStore: {
        [key: string]: any;
    };
    /** Add plugin to this instance of SpringRoll */
    static addPlugin(plugin: ApplicationPlugin): void;
    constructor(options: GameOptions);
    private preloadGlobal;
    /** overrride and return list of global assets */
    protected preload(): AssetList;
    /** called when game is ready to enter first scene - override this function and set first scene here */
    protected gameReady(): void;
    addScene(id: string, scene: typeof Scene): void;
    addScenes(sceneMap: {
        [key: string]: typeof Scene;
    }): void;
    /**
     * Transition to specified scene
     * @param {string} sceneID ID of Scene to transition to
     */
    changeScene(sceneID: string): void;
}
/** Configuration object for Game */
export interface GameOptions {
    /** SpringRoll Application configuration options */
    springRollConfig: SpringRoll.ApplicationConfig;
    /** target width of game in pixels */
    width: number;
    /** target height of game in pixels */
    height: number;
    /** alternate width - wider or narrower than base width. Cannot be used with altHeight */
    altWidth?: number;
    /** alternate height - taller or shorter than base height. Cannot be used with altWidth */
    altHeight?: number;
    /** caption configuration */
    captions?: CaptionParams;
    /** Class of Animate Stage to use for transitions */
    transition: AnimateStage;
    /** ID of HTML element on your page to add this game's Canvas to */
    containerID: string;
}
export declare type CaptionParams = {
    config: SpringRoll.CaptionData;
    display?: SpringRoll.IRender;
};
