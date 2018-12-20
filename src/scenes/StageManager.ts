import Scene from './Scene';
import AssetManager, { AnimateStage } from '../assets/AssetManager';


const TRANSITION_ID = 'wgbhSpringRollGameTransition';

export default class StageManager{
    public pixi: PIXI.Application;
    public width: number;
    public height: number;
    public transition:PIXI.animate.MovieClip;

    private _currentScene:Scene;

    private assetManager:AssetManager;
    private transitioning = true;
    private isPaused = false;

    constructor(assetManager:AssetManager, containerID:string, width:number, height:number){
        this.assetManager = assetManager;

        this.pixi = new PIXI.Application({ width, height, antialias:true, autoResize:true});
        this.pixi.view.style.height = null;
        this.pixi.view.style.width = '100%';
        document.getElementById(containerID).appendChild(this.pixi.view);
        this.pixi.ticker.add(this.update.bind(this));
    }

    init(transition:AnimateStage, firstScene:Scene){
        this.setTransition(transition, ()=>{
            this.scene = firstScene;
        });
    }

    get scene(){
        return this._currentScene;
    }

    set scene(scene:Scene){
        this.changeScene(scene);
    }

    setTransition(stage:AnimateStage, callback:Function){
        this.assetManager.loadAssets([
                {type:'animate', stage:stage, id:TRANSITION_ID, isGlobal:true, cacheInstance:true}
            ], ()=>{
                this.transition = this.assetManager.animations[TRANSITION_ID];
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

    changeScene = (newScene:Scene) => {
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
                    return oldScene.cleanup();
                }
            })
            .then(()=>{
                //clear PIXI caches
                this.assetManager.unloadAssets();
            })
            .then(() => {
                this._currentScene = newScene;
                return new Promise((resolve)=>{
                    this.assetManager.loadAssets(newScene.preload(), resolve);
                });
            })
            .then(()=>{
                newScene.setup();
                this.pixi.stage.addChildAt(newScene, 0);
                return new Promise((resolve)=>{
                    PIXI.animate.Animator.play(this.transition, 'reveal', resolve);
                });
            })
            .then(()=>{
                this.transitioning = false;
                this.pixi.stage.removeChild(this.transition);
                newScene.start();
            });
    }

    get pause(){
        return this.isPaused;
    }
    set pause(pause:boolean){
        this.isPaused = pause;
        pause ? this.pixi.ticker.stop() : this.pixi.ticker.start();
    }

    update(deltaTime:number){
        // if the game is paused, or there isn't a scene, we can skip rendering/updates  
        if (this.transitioning || this.isPaused || !this._currentScene){
            return;
        }

        this._currentScene.update(deltaTime);
    }

}