import * as SpringRoll from 'springroll';

import AssetManager, { AnimateStage } from "./assets/AssetManager";
import StageManager from "./scenes/StageManager";
import SoundManager from './sound/SoundManager';
import { Scene } from '.';


/** Base Class for WGBH SpringRoll Games - extend this Class in your project */
export default class Game {

    /** SpringRoll Application, interface to Container */
    public app: SpringRoll.Application;
    /** Asset Manager, for loading, caching, and unloading of assets */
    public assets:AssetManager;
    /** Stage Manager, for managing Scenes, transitions, and renderer */
    public stageManager: StageManager;
    /** Sound Manager, for controlling Playback, pausing/resuming, and volume of Sounds */
    public sound: SoundManager;

    /** Map of Scenes by Scene IDs, set this in your instance extending this Class */
    protected scenes: {[key:string]:Scene};

    constructor(options:GameOptions){
        this.sound = new SoundManager();
        this.assets = new AssetManager(this.sound);
        this.stageManager = new StageManager(this.assets, options.containerID, options.width, options.height);

        this.app = new SpringRoll.Application(options.springRollConfig);
        this.app.state.soundVolume.subscribe((volume)=>{
            this.sound.volume = volume;
        });
        this.app.state.musicVolume.subscribe((volume)=>{
            this.sound.musicVolume = volume;
        });
        this.app.state.sfxVolume.subscribe((volume)=>{
            this.sound.sfxVolume = volume;
        });
        this.app.state.voVolume.subscribe((volume)=>{
            this.sound.voVolume = volume;
        });
        this.app.state.pause.subscribe((pause)=>{
            pause ? this.sound.pause() : this.sound.resume();
            this.stageManager.pause = pause;
        });

        this.app.state.ready.subscribe(() => {
                this.stageManager.setTransition(options.transition, this.gameReady.bind(this));
            });
    }

    /** called when game is ready to enter first scene - override this function and set first scene here */
    protected gameReady(){
        //override and set first scene in this function
    }
    
    /**
     * Transition to specified scene
     * @param {string} sceneID ID of Scene to transition to
     */
    changeScene(sceneID:string){
        const scene = this.scenes[sceneID];
        if(!scene){
            throw new Error(`No Scene found with ID "${sceneID}"`);
        }
        this.stageManager.scene = scene;
    }
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