import * as SpringRoll from 'springroll';
import AssetManager, { AnimateStage } from "./assets/AssetManager";
import StageManager from "./scenes/StageManager";
import SoundManager from './sound/SoundManager';
import { Scene } from '.';
export default class Game {
    app: SpringRoll.Application;
    private _isPaused;
    assets: AssetManager;
    stageManager: StageManager;
    sound: SoundManager;
    protected scenes: {
        [key: string]: Scene;
    };
    constructor(options: GameOptions);
    /** called when game is ready to enter first scene - set first scene here */
    protected gameReady(): void;
    changeScene(sceneID: string): void;
    pause: boolean;
}
export interface GameOptions {
    springRollConfig: SpringRoll.ApplicationConfig;
    width: number;
    height: number;
    transition: AnimateStage;
    containerID: string;
}
