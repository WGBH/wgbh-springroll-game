import * as SpringRoll from 'springroll';

import AssetManager, { AnimateStage } from "./assets/AssetManager";
import StageManager from "./scenes/StageManager";
import SoundManager from './sound/SoundManager';
import { Scene } from '.';

export default class Game {

    public app: SpringRoll.Application;
    private _isPaused: boolean;

    public assets:AssetManager;
    public stageManager: StageManager;
    public sound: SoundManager;

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
            this.pause = pause;
        });

        this.app.state.ready.subscribe(() => {
                this.stageManager.setTransition(options.transition, this.gameReady.bind(this));
            });
    }

    /** called when game is ready to enter first scene - set first scene here */
    protected gameReady(){
        //override and set first scene in this function
    }

    changeScene(sceneID:string){
        const scene = this.scenes[sceneID];
        if(!scene){
            throw new Error(`No Scene found with ID "${sceneID}"`);
        }
        this.stageManager.scene = scene;
    }

    get pause(){
        return this._isPaused;
    }
    set pause(pause:boolean){
        this._isPaused = pause;
        pause ? this.sound.pause() : this.sound.resume();
        this.stageManager.pause = pause;
    }
}

export interface GameOptions {
    springRollConfig: SpringRoll.ApplicationConfig;
    width: number;
    height: number;
    transition: AnimateStage;
    containerID: string;
}