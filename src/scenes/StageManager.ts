import Scene from './Scene';
import { AnimateStage } from '../assets/AssetManager';
import { Game } from '..';
import Tween from '../tween/Tween';
import PauseableTimer from '../timer/PauseableTimer';
import { PointLike } from 'pixi.js';
import { ScaleManager } from 'springroll';


const TRANSITION_ID = 'wgbhSpringRollGameTransition';

/**
 * Manages rendering and transitioning between Scenes
 */
export default class StageManager{
    public pixi: PIXI.Application;
    public width: number;
    public height: number;
    public scale:number;
    public offset:PointLike; // offset for the x,y origin when resizing
    public leftEdge:number; // shortcut to find the left edge
    public rightEdge:number; // shortcut to find the right edge
    public transition:PIXI.animate.MovieClip;

    private _currentScene:Scene;

    private scaleManager:ScaleManager;
    private _minSize:ScreenSize;
    private _maxSize:ScreenSize;
    private _originSize:ScreenSize;

    private transitioning = true;
    private isPaused = false;
    private game:Game;

    /** Map of Scenes by Scene IDs */
    private scenes: {[key:string]:typeof Scene} = {};

    private tweens:Tween[] = [];
    private timers:PauseableTimer[] = [];

    constructor(game:Game, containerID:string, width:number, height:number, altWidth?:number){
        this.game = game;

        this.width = width;
        this.height = height;

        this.offset = new PIXI.Point(0,0);


        this.pixi = new PIXI.Application({ width, height, antialias:true, autoResize:false, resolution:window.devicePixelRatio});
        this.pixi.view.style.display = 'block';

        document.getElementById(containerID).appendChild(this.pixi.view);

        const baseSize = {width:width,height:height};
        altWidth = altWidth || width;
        const altSize = {width:altWidth,height:height};
        const scale = {
            origin:baseSize,
            min:(altWidth > width) ? baseSize : altSize,
            max:(altWidth > width) ? altSize : baseSize
        };
        this.setScaling(scale);

        this.pixi.ticker.add(this.update.bind(this));

        this.scaleManager = new ScaleManager(this.gotResize);
        console.log(this.scaleManager); // just to quiet the errors... what else should be done with scalemanager instance?
    }

    addScene(id:string, scene:typeof Scene){
        this.scenes[id] = scene;
    }
    addScenes(sceneMap:{[key:string]:typeof Scene}){
        for(let id in sceneMap){
            this.scenes[id] = sceneMap[id];
        }
    }

    setTransition(stage:AnimateStage, callback:Function){
        this.game.assetManager.loadAssets([
                {type:'animate', stage:stage, id:TRANSITION_ID, isGlobal:true, cacheInstance:true}
            ], ()=>{
                this.transition = this.game.cache.animations[TRANSITION_ID];
                const curtainLabels = [
                    'cover',
                    'cover_stop',
                    'load',
                    'load_loop',
                    'reveal',
                    'reveal_stop'
                ];
                for(let label of curtainLabels){
                    if(!this.transition.labelsMap.hasOwnProperty(label)){
                        console.error('Curtain MovieClip missing label: ', label);
                        return;
                    }
                }
                this.transition.gotoAndStop('cover');
                callback();
            });
    }

    /**
     * Transition to specified scene
     * @param {string} sceneID ID of Scene to transition to
     */
    changeScene = (newScene:string) => {
        const NewScene = this.scenes[newScene];
        if(!NewScene){
            throw new Error(`No Scene found with ID "${newScene}"`);
        }

        const oldScene = this._currentScene;
        this.transitioning = true;
        Promise.resolve()
            .then(()=>{
                this.pixi.stage.addChild(this.transition);
                this.transition.stop();
                if(oldScene){
                    return new Promise((resolve)=>{
                        PIXI.animate.Animator.play(this.transition, 'cover', resolve);
                    });
                }
            })
            .then(()=>{
                PIXI.animate.Animator.play(this.transition, 'load');
                if(oldScene){
                    this.pixi.stage.removeChild(oldScene);
                    oldScene.cleanup();
                    oldScene.destroy({children:true});
                }
                this.game.assetManager.unloadAssets();
            })
            .then(() => {
                this._currentScene = new NewScene(this.game);
                return new Promise((resolve)=>{
                    this.game.assetManager.loadAssets(this._currentScene.preload(), resolve);
                });
            })
            .then(()=>{
                this._currentScene.setup();
                this.pixi.stage.addChildAt(this._currentScene, 0);
                return new Promise((resolve)=>{
                    PIXI.animate.Animator.play(this.transition, 'reveal', resolve);
                });
            })
            .then(()=>{
                this.transitioning = false;
                this.pixi.stage.removeChild(this.transition);
                this._currentScene.start();
            });
    }

    get pause(){
        return this.isPaused;
    }
    set pause(pause:boolean){
        this.isPaused = pause;
        this._currentScene.pause(pause);
        pause ? this.pixi.ticker.stop() : this.pixi.ticker.start();
    }

    getSize(width:number,height:number):ScreenSize {
        if (height === 0) { return null; }
        return {
            width:width,
            height:height,
            ratio:width/height
        };
    }

    setScaling(scaleconfig:ScaleConfig) {
        if(scaleconfig.origin) {
            this._originSize = this.getSize(scaleconfig.origin.width,scaleconfig.origin.height);
        }
        if(scaleconfig.min) {
            this._minSize = this.getSize(scaleconfig.min.width,scaleconfig.min.height);
        }
        if(scaleconfig.max) {
            this._maxSize = this.getSize(scaleconfig.max.width,scaleconfig.max.height);
        }
        this.resize(window.innerWidth, window.innerHeight);
    }

    gotResize = (newsize:ScreenSize) => {
        this.resize(newsize.width,newsize.height);
    }

    resize(width:number, height:number) {
        const aspect = width / height;
        let offset = 0;
        //let scale;
        let calcwidth = this._minSize.width;
        if(aspect > this._maxSize.ratio) {
            // locked in at max (2:1)
            this.scale = this._minSize.ratio/this._maxSize.ratio;
            calcwidth = this._maxSize.width;
            
            // these styles could - probably should - be replaced by media queries in CSS
            this.pixi.view.style.height = '100vh';
            this.pixi.view.style.width = parseInt((this._maxSize.ratio * 100).toString()) + 'vh';
            this.pixi.view.style.margin = '0 auto';
        } else if (aspect < this._minSize.ratio) {
            this.scale = 1;

            this.pixi.view.style.height = parseInt((100 / this._minSize.ratio).toString()) + 'vw';
            this.pixi.view.style.width = '100vw';
            this.pixi.view.style.margin = 'calc((100vh - ' + (100 / this._minSize.ratio).toString() + 'vw)/2) 0';
        } else {
            // between min and max ratio (wider than min)
            this.scale = this._minSize.ratio / aspect;
            calcwidth = this._minSize.width / this.scale; // how much wider is this?

            this.pixi.view.style.height = '100vh';
            this.pixi.view.style.width = '100vw';
            this.pixi.view.style.margin = '0';
        }
        offset = (calcwidth - this._originSize.width) * 0.5; // offset assumes that the upper left on MIN is 0,0 
        this.pixi.stage.position.x = offset;

        this.pixi.renderer.resize(calcwidth,this._minSize.height);
        this.offset.x = offset;
        if (this._currentScene) {
          this._currentScene.resize(calcwidth,this._minSize.height,this.offset);
        }
    }


    /**
     * 
     * globalToScene converts a "global" from PIXI into the scene level, taking into account the offset based on responsive resize
     * 
     * @param pointin 
     */
    globalToScene(pointin:PointLike) {
        return {x:pointin.x - this.offset.x, y:pointin.y - this.offset.y};
    }

    addTween(tween:Tween){
        this.tweens.push(tween);
    }
    
    clearTweens() {
        this.tweens.forEach(function(tween:Tween) {
            tween.destroy(false);
        });
        this.tweens = [];
    }

    addTimer(timer:PauseableTimer){
        this.timers.push(timer);
    }

    clearTimers() {
        this.timers.forEach(function(timer:PauseableTimer) {
            timer.destroy(false);
        });
        this.timers = [];
    }


    update(){
        // if the game is paused, or there isn't a scene, we can skip rendering/updates  
        if (this.transitioning || this.isPaused || !this._currentScene){
            return;
        }
        const elapsed = PIXI.ticker.shared.elapsedMS;
        if(this.tweens.length){
            for(let i = this.tweens.length - 1; i >= 0; i--){
                if(this.tweens[i].active){
                    this.tweens[i].update(elapsed);
                }
                if(!this.tweens[i].active){
                    this.tweens.splice(i, 1);
                }
            }
        }
        if(this.timers.length){
            for(let i = this.timers.length - 1; i >= 0; i--){
                if(this.timers[i].active){
                    this.timers[i].update(elapsed);
                }
                if(!this.timers[i].active){
                    this.timers.splice(i, 1);
                }
            }
        }
        this._currentScene.update(elapsed);
    }

}


export type ScreenSize = {
    width:number,
    height:number,
    ratio:number
};

export type RectLike = {
    width:number,
    height:number
};

export type ScaleConfig = {
    origin?:RectLike,
    min?:RectLike,
    max?:RectLike
};
