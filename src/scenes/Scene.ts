import Game from '../Game';
import { AssetList, AssetManager, SoundManager, StageManager } from '..';
import { AssetCache } from '../assets/AssetManager';
import Tween, { Ease } from '../tween/Tween';
import PauseableTimer from '../timer/PauseableTimer';
import { Application } from 'springroll';
import { Point } from '@pixi/math';
import { Container } from 'pixi.js';

/**
 * Generic Scene base class, parent container for all art and functionality in a given scene
 */
export default class Scene extends Container {

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

    /** Object reference to Game's SpringRoll Application, interface to Container */
    protected readonly app: Application;

    /** instance of Game that this Scene belongs to */
    protected readonly game: Game;

    constructor(game:Game) {
        super();
        this.game = game;
        this.app = game.app;
        this.assetManager = game.assetManager;
        this.cache = this.assetManager.cache;
        this.sound = game.sound;
        this.stageManager = game.stageManager;
        this.dataStore = game.dataStore;
    }

    /**
     * Provide list of assets to preload.
     * Optionally, return a Promise which may return a list of assets to preload.
     * @returns {AssetList | Promise<AssetList>}
     */
    preload(): AssetList | Promise<AssetList>{
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
     * Prepare initial visual state - called after preload is complete, while scene is obscured by loader.
     * Optionally return a Promise, which will delay removal of the loader until it is resolved.
     * @returns {Promise<any> | void}
     */
    setup(): Promise<any> | void{
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
    tween(target:any, values:any, time:number, ease?:Ease):Tween{
        console.warn('Scene.tween() is deprecated, please use Tween.get()');
        return Tween.get(target).to(values, time, ease);
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
        return new PauseableTimer(callback, time);
    }

    clearTimeout(timer:PauseableTimer) {
        if(timer) {
            timer.destroy(false); // destroy without triggering the callback function
        }
    }

    setInterval(callback: Function, time:number):PauseableTimer {
        return new PauseableTimer(callback, time, true);
    }

    clearInterval(timer:PauseableTimer) {
        if(timer) {
            timer.destroy(false); // destroy without triggering the callback function
        }
    }

    resize(width:number, height:number, offset:Point) {
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