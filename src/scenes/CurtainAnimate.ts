
import Curtain from './Curtain';
import {AssetList,AssetCache,AnimateStage} from "../assets/AssetManager";
import { StageManager } from '..';
/**
 * Animate Curtain 
 */
export default class CurtainAnimate extends Curtain {

    public stage:AnimateStage;
    public transition:PIXI.animate.MovieClip;
    public id:string;

    constructor(stage:AnimateStage,id:string) {
        super();
        this.stage = stage;
        this.id = id;
    }

    assetsToLoad(arg?:any):AssetList {
        return [
            {type:'animate', stage:this.stage, id:this.id, isGlobal:true, cacheInstance:true}
        ];
    }

    close(callback:Function):void {
        this.transition.visible = true;
        PIXI.animate.Animator.play(this.transition, 'cover', callback);
    }

    open(callback:Function):void {
        this.transition.visible = true;
        PIXI.animate.Animator.play(this.transition, 'reveal',callback);
    }

    init(stagemanager:StageManager,cache:AssetCache):boolean {

        this.stageManager = stagemanager;
        this.transition = cache.animations[this.id];
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
                return false;
            }
        }
        return true;
    }

    cover() {
        this.transition.visible = true;
        this.transition.gotoAndStop('cover');
    }
    add(mainstage:PIXI.Container) {
        mainstage.addChild(this.transition);
    }
    hide(mainstage:PIXI.Container) {
        this.transition.stop();
        mainstage.removeChild(this.transition);
        this.transition.visible = false;
    }
    
    loading() {
        PIXI.animate.Animator.play(this.transition, 'load');
    }

    progress(pct:number) {

    }
    
}