import * as SpringRoll from 'springroll';
import AssetManager, { AnimateStage } from "./assets/AssetManager";
import StageManager from "./scenes/StageManager";
import SoundManager from './sound/SoundManager';
import { Scene } from '.';
/** Base Class for WGBH SpringRoll Games - extend this Class in your project */
export default class Game {
    /** SpringRoll Application, interface to Container */
    app: SpringRoll.Application;
    /** Asset Manager, for loading, caching, and unloading of assets */
    assets: AssetManager;
    /** Stage Manager, for managing Scenes, transitions, and renderer */
    stageManager: StageManager;
    /** Sound Manager, for controlling Playback, pausing/resuming, and volume of Sounds */
    sound: SoundManager;
    /** Map of Scenes by Scene IDs, set this in your instance extending this Class */
    protected scenes: {
        [key: string]: Scene;
    };
    constructor(options: GameOptions);
    /** called when game is ready to enter first scene - override this function and set first scene here */
    protected gameReady(): void;
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
    /** Class of Animate Stage to use for transitions */
    transition: AnimateStage;
    /** ID of HTML element on your page to add this game's Canvas to */
    containerID: string;
}
