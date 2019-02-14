import Game from '../Game';
import { AssetList, AssetManager, SoundManager, StageManager } from '..';
import { AssetCache } from '../assets/AssetManager';
import Tween, { Ease } from '../tween/Tween';
import PauseableTimer from '../timer/PauseableTimer';
import { PointLike } from 'pixi.js';

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
    protected readonly stageManager: StageManager;

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
     * @param {number} deltaTime time since last frame in milliseconds.
     */
    update(deltaTime:number) {
        //override this to get update ticks
    }

    /**
     * Simple tween target's numeric properties to specified values over time with easinbg
     * @param target object with values to tween
     * @param values numeric end values of tweening target, keyed by target property names
     * @param time number of frames over which to tween target values
     * @param [ease] name of easing curve to apply to tween
     * @returns {Tween} instance of Tween, for pausing/cancelling
     */
    tween(target:any, values:any, time:number, ease?:Ease){
        const tween = new Tween(target, values, time, ease);
        this.stageManager.addTween(tween);
        return tween;
    }

    /**
     * 
     * Replacement for the window.setTimeout, this timeout will pause when the game is paused.
     * Similar to Tween
     * 
     * @param callback 
     * @param time 
     */
    setTimeout(callback: Function, time:number):PauseableTimer {
        const timer = new PauseableTimer(callback, time);
        this.stageManager.addTimer(timer);
        return timer;
    }

    clearTimeout(timer:PauseableTimer) {
        if(timer) {
            timer.destroy(false); // destroy without triggering the callback function
        }
    }

    setInterval(callback: Function, time:number):PauseableTimer {
        const timer = new PauseableTimer(callback, time, true);
        this.stageManager.addTimer(timer);
        return timer;
    }

    clearInterval(timer:PauseableTimer) {
        if(timer) {
            timer.destroy(false); // destroy without triggering the callback function
        }
    }

    resize(width:number, height:number, offset:PointLike) {
        // in case something special needs to happen on resize
    }

    /**
     * Called when Scene is about to transition out - override to clean up art or other objects in memory
     * @returns {void} return a Promise to resolve when any asynchronous cleanup is complete
     */
    cleanup():void {
        //override this to clean up Scene
    }


}