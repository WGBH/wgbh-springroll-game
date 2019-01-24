import Scene from './Scene';
import { AnimateStage } from '../assets/AssetManager';
import { Game } from '..';
import Tween from '../tween/Tween';
import PauseableTimer from '../timer/PauseableTimer';


const TRANSITION_ID = 'wgbhSpringRollGameTransition';

/**
 * Manages rendering and transitioning between Scenes
 */
export default class StageManager{
    public pixi: PIXI.Application;
    public width: number;
    public height: number;
    public transition:PIXI.animate.MovieClip;

    private _currentScene:Scene;

    private transitioning = true;
    private isPaused = false;
    private game:Game;

    /** Map of Scenes by Scene IDs */
    private scenes: {[key:string]:typeof Scene} = {};

    private tweens:Tween[] = [];
    private timers:PauseableTimer[] = [];

    constructor(game:Game, containerID:string, width:number, height:number){
        this.game = game;

        this.width = width;
        this.height = height;

        this.pixi = new PIXI.Application({ width, height, antialias:true, autoResize:true});
        this.pixi.view.style.height = null;
        this.pixi.view.style.width = '100%';
        document.getElementById(containerID).appendChild(this.pixi.view);
        this.pixi.ticker.add(this.update.bind(this));
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