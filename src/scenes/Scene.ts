import Game from '../Game';
import { AssetList, AssetManager, SoundManager, StageManager } from '..';
import { AssetCache } from '../assets/AssetManager';

/**
 * Generic Scene base class, parent container for all art and functionality in a given scene
 */
export default class Scene extends PIXI.Container {

    /** Object containing references to cached instances of assets loaded by the AssetManager */
    protected readonly cache: AssetCache;

    /** Object for storing any data (such as state or progress) which needs to persist beyone a single Scene */
    protected readonly dataStore: {[key:string]:any};

    /** interface for playing back and controlling sounds */
    protected readonly sound: SoundManager;
    
    /** 
     * Manages loading and unloading of assets.
     * Should not be controlled directly by a game Scene except in advanced use cases.
     */
    protected readonly assetManager: AssetManager;

    /** Manages transitioning between Scenes - not intended to be controlled directly by a game Scene */
    private readonly stageManager: StageManager;

    constructor(game:Game) {
        super();
        this.assetManager = game.assetManager;
        this.cache = this.assetManager.cache;
        this.sound = game.sound;
        this.stageManager = game.stageManager;
        this.dataStore = game.dataStore;
    }

    /**
     * provide list of assets to preload
     * @returns {AssetList}
     */
    preload():AssetList {
        return;
    }

    /**
     * Exit this Scene and transition to specified scene
     * @param {string} sceneID ID of Scene to transition to
     */
    changeScene(sceneID:string){
        this.stageManager.changeScene(sceneID);
    }

    /**
     * prepare initial visual state - called after preload is complete, while scene is obscured by loader
     */
    setup(){
        //override this, called to prepare graphics
    }
    
    /**
     * entrypoint to scene - called after loader transition is complete
     */
    start() {
        //override this - called to start scene
    }

    /**
     * pause scene - override this if you need to pause functionality of your scene
     * when the rendering and sound is paused
     * @param paused whether or not the game is being paused (false if being resumed)
     */
    pause(paused:boolean){
        //override this if you have custom timed functionality that should be paused
        //with the rest of the game
    }

    /**
     * callback for frame ticks
     * @param {number} deltaTime time since last frame in multiples of one frame's length of time.
     */
    update(deltaTime:number) {
        //override this to get update ticks
    }

    /**
     * Called when Scene is about to transition out - override to clean up art or other objects in memory
     * @returns {void} return a Promise to resolve when any asynchronous cleanup is complete
     */
    cleanup():void {
        //override this to clean up Scene
    }
}