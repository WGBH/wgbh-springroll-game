import * as SpringRoll from 'springroll';

import AssetManager, { AnimateStage, AssetCache, AssetList } from "./assets/AssetManager";
import StageManager from "./scenes/StageManager";
import SoundManager from './sound/SoundManager';
import { Scene } from '.';
import { ApplicationPlugin } from 'springroll';


/** Base Class for WGBH SpringRoll Games - extend this Class in your project */
export default class Game {

    /** SpringRoll Application, interface to Container */
    public app: SpringRoll.Application;
    /** Asset Manager, for loading, caching, and unloading of assets */
    public assetManager:AssetManager;
    /** Object containing references to instances of cached assets */
    public cache:AssetCache;
    /** Stage Manager, for managing Scenes, transitions, and renderer */
    public stageManager: StageManager;
    /** Sound Manager, for controlling Playback, pausing/resuming, and volume of Sounds */
    public sound: SoundManager;
    /** object for storing global data - accessible from all Scenes */
    public dataStore: {[key:string]:any} = {};

    /** Add plugin to this instance of SpringRoll */
    static addPlugin(plugin:ApplicationPlugin){
        SpringRoll.Application.uses(plugin);
    }

    constructor(options:GameOptions){
        this.sound = new SoundManager();
        this.assetManager = new AssetManager(this.sound);
        this.cache = this.assetManager.cache;
        this.stageManager = new StageManager(this, options.containerID, options.width, options.height, options.altWidth, options.altHeight);

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
            if(this.stageManager.pause !== pause){
                pause ? this.sound.pause() : this.sound.resume();
                this.stageManager.pause = pause;
            }
        });
        this.app.state.captionsMuted.subscribe((isMuted:boolean)=> {
            this.stageManager.captionsMuted = isMuted;
        });

        this.app.state.ready.subscribe(() => {
                this.stageManager.setTransition(options.transition, this.preloadGlobal);
            });

        if(options.captions) {
            this.stageManager.addCaptions(options.captions.config,options.captions.display);
        }
    }

    private preloadGlobal = ()=>{
        const assets = this.preload();
        if(assets && assets.length){
            for(let asset of assets){
                //Game-level assets are always global
                asset.isGlobal = true;
            }
            this.assetManager.unloadAssets();//Prep for fresh loading
            this.assetManager.loadAssets(assets, this.gameReady.bind(this));
        }
        else{
            this.gameReady();
        }
    }

    /** overrride and return list of global assets */
    protected preload():AssetList{
        return null;
    }

    /** called when game is ready to enter first scene - override this function and set first scene here */
    protected gameReady(){
        //override and set first scene in this function
    }

    addScene(id:string, scene:typeof Scene){
        this.stageManager.addScene(id, scene);
    }
    addScenes(sceneMap:{[key:string]:typeof Scene}){
        this.stageManager.addScenes(sceneMap);
    }
    
    /**
     * Transition to specified scene
     * @param {string} sceneID ID of Scene to transition to
     */
    changeScene(sceneID:string){
        this.stageManager.changeScene(sceneID);
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

export type CaptionParams = {
    config:SpringRoll.CaptionData,
    display?:SpringRoll.IRender
};