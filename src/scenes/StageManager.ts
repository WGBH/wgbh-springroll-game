import Scene from './Scene';
import { Game } from '..';
import GameTime from '../timer/GameTime';
import PauseableTimer from '../timer/PauseableTimer';
import { ScaleManager, CaptionPlayer, CaptionData, IRender, Property } from 'springroll';
import { Application } from '@pixi/app';
import { Point } from '@pixi/math';
import { AnimateAsset, Animator, MovieClip } from '@pixi/animate';
import { Ticker } from '@pixi/ticker';

const LOADING_DELAY = 250;

/** Devices which are known/expected to flicker if Pixi's `transparent` mode is not enabled */
const FLICKERERS = [
    //Kindle fire tablets:
    // /KFMUWI/, /KFKAWI/, /KFSUWI/, /KFAUWI/, /KFDOWI/, /KFGIWI/, /KFFOWI/, /KFMEWI/, /KFTBWI/, /KFARWI/, /KFASWI/, /KFSAWA/, /KFSAWI/, /KFAPWA/, /KFAPWI/, /KFTHWA/, /KFTHWI/, /KFSOWI/, /KFJWA/, /KFJWI/,
    /KF.?.WI/,
    /KF.?.WA/,
    /KFTT/,
    /KFOT/,
    /Kindle Fire/,
    /Silk/,
    //Galaxy Tab A 7":
    /SM-T280/,
    //RCA tablets:
    // /RCT6077W2/, /RCT6103W46/, /RCT6203W46/, /RCT6272W23/, /RCT6303W87/, /RCT6378W2/, /RCT6773W22/, /RCT6773W42/, /RCT6873W42/, /RCT6973W43/,
    /RCT6\d\d\dW\d?\d/
];


const TRANSITION_ID = 'wgbhSpringRollGameTransition';

/**
 * Manages rendering and transitioning between Scenes
 */
export default class StageManager{
    public pixi: Application;
    public width: number;
    public height: number;
    public offset:Point; // offset for the x,y origin when resizing
    public transition:MovieClip;
    public viewFrame:Property<ViewFrame>;
    public leftEdge:number; // deprecate leftEdge/rightEdge in favor of more comprehensive viewFrame
    public rightEdge:number;
    public scaleManager:ScaleManager;

    private _currentScene:Scene;

    private _minSize:ScreenSize;
    private _maxSize:ScreenSize;

    private transitioning = true;
    private isPaused = false;
    private game:Game;

    private captions:CaptionPlayer;
    private isCaptionsMuted:boolean;

    /** Map of Scenes by Scene IDs */
    private scenes: {[key:string]:typeof Scene} = {};
    public get scale():number{
        console.warn('scale is obsolete, please reference viewFrame for stage size info');
        return 1;
    }

    constructor(game:Game){
        this.game = game;
    }

    createRenderer(containerID:string, width:number, height:number, altWidth?:number, altHeight?:number, playOptions?:any & {cordova?:string, platform?:string, model?:string, osVersion?:string}){
        if(altWidth && altHeight){
            console.error('responsive scaling system only supports altWidth OR altHeight, using both will produce undesirable results');
        }

        this.width = width;
        this.height = height;

        this.offset = new Point(0,0);

        // transparent rendering mode is bad for overall performance, but necessary in order
        // to prevent flickering on some Android devices such as Galaxy Tab A and Kindle Fire
        const flickerProne = !!FLICKERERS.find((value) => value.test(navigator.userAgent));

        // Does this version of Safari break antialiasing?
        let badSafari = navigator.userAgent.includes('Safari') && navigator.userAgent.includes('Version/15.4');
        // For Cordova:
        let cordovaWindow:Window & {device:{platform:string; version:string;}} = window as any;
        if(cordovaWindow.device && cordovaWindow.device.platform === 'iOS' && cordovaWindow.device.version.startsWith('15.4')){
            badSafari = true;
        }
        else if(playOptions && playOptions.cordova && playOptions.platform === 'iOS'){
            if(playOptions.osVersion){
                badSafari = playOptions.osVersion.startsWith('15.4');
            }
            else{
                //if no osVersion provided by Games App, disable antialiasing on all iOS
                badSafari = true;
            }
        }

        this.pixi = new Application({ width, height, antialias:!badSafari, backgroundAlpha:flickerProne ? 0 : 1});
        let view = this.pixi.view as HTMLCanvasElement;
        view.style.display = 'block';

        document.getElementById(containerID).appendChild(view);

        const baseSize = {width:width,height:height};

        altWidth = altWidth || width;
        altHeight = altHeight || height;
        const altSize = {width:altWidth,height:altHeight};
        const altBigger = altWidth > width || altHeight > height;
        const scale = {
            min:altBigger ? baseSize : altSize,
            max:altBigger ? altSize : baseSize
        };
        this.setScaling(scale);

        this.pixi.ticker.add(this.update.bind(this));

        this.scaleManager = new ScaleManager(this.gotResize);
    }

    addCaptions(captionData:CaptionData, renderer:IRender) {
        this.captions = new CaptionPlayer(captionData, renderer);
    }

    setCaptionRenderer(renderer:IRender) {
        if(this.captions){
            this.captions.renderer = renderer;
        }
        else{
            console.warn('no captions player exists. call `addCaptions()` or include in GameOptions');
        }
    }

    addScene(id:string, scene:typeof Scene){
        this.scenes[id] = scene;
    }
    addScenes(sceneMap:{[key:string]:typeof Scene}){
        for(let id in sceneMap){
            this.scenes[id] = sceneMap[id];
        }
    }

    setTransition(asset:AnimateAsset, callback:Function){
        this.game.assetManager.loadAssets([
                {type:'animate', asset:asset, id:TRANSITION_ID, isGlobal:true, cacheInstance:true}
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
                    return new Promise<void>((resolve)=>{
                        Animator.play(this.transition, 'cover', resolve);
                    });
                }
            })
            .then(()=>{
                Animator.play(this.transition, 'load');
                if(oldScene){
                    this.pixi.stage.removeChild(oldScene);
                    oldScene.cleanup();
                    oldScene.destroy({children:true});
                }
                this.game.assetManager.unloadAssets();
            })
            .then(()=>{
                return new Promise((resolve)=>{
                    setTimeout(resolve, LOADING_DELAY);
                });
            })
            .then(() => {
                this._currentScene = new NewScene(this.game);
                return this._currentScene.preload();
            })
            .then((assetList)=>{
                if(assetList){
                    return new Promise((resolve)=>{
                        this.game.assetManager.loadAssets(assetList, resolve);
                    });
                }
            })
            .then(()=>{
                return new Promise((resolve)=>{
                    setTimeout(resolve, LOADING_DELAY);
                });
            })
            .then(()=>{
                return this._currentScene.setup();
            })
            .then(()=>{
                return new Promise((resolve)=>{
                    setTimeout(resolve, LOADING_DELAY);
                });
            })
            .then(()=>{
                this.pixi.stage.addChildAt(this._currentScene, 0);
            })
            .then(()=>{
                return new Promise((resolve)=>{
                    setTimeout(resolve, LOADING_DELAY);
                });
            })
            .then(()=>{
                return new Promise<void>((resolve)=>{
                    Animator.play(this.transition, 'reveal', resolve);
                });
            })
            .then(()=>{
                this.transitioning = false;
                this.pixi.stage.removeChild(this.transition);
                this._currentScene.start();
            });
    }

    get captionsMuted(){
        return this.isCaptionsMuted;
    }
    set captionsMuted(muted:boolean){
        this.isCaptionsMuted = muted;
        if (muted && this.captions) {
            this.captions.stop();
        }
    }
    get pause(){
        return this.isPaused;
    }
    set pause(pause:boolean){
        this.isPaused = pause;
        if(this._currentScene){
            this._currentScene.pause(pause);
        }
        if(this.pixi && this.pixi.ticker){
            if(pause){
                Ticker.shared.stop();
            }
            else{
                Ticker.shared.start();
            }
        }
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
            console.warn('origin is obsolete and will be ignored');
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
        const wideSize = this._maxSize.width > this._minSize.width ? this._maxSize : this._minSize;
        const tallSize = this._maxSize.height > this._minSize.height ? this._maxSize : this._minSize;
        let calcwidth:number;
        let calcheight:number;
        let view = this.pixi.view as HTMLCanvasElement;
        if(aspect > wideSize.ratio) {
            // locked in at max (2:1)
            calcwidth = wideSize.width;
            calcheight = wideSize.height;
            // these styles could - probably should - be replaced by media queries in CSS
            view.style.height = `${height}px`;
            view.style.width = `${Math.floor(wideSize.ratio * height)}px`;
            view.style.margin = '0 auto';
        } else if (aspect < tallSize.ratio) {
            calcwidth = tallSize.width;
            calcheight = tallSize.height;
            let viewHeight = Math.floor(width / tallSize.ratio);
            view.style.height = `${viewHeight}px`;
            view.style.width = `${width}px`;
            view.style.margin = `${Math.floor((height - viewHeight)/2)}px 0`;
        } else {
            // between min and max ratio
            if(wideSize.width !== tallSize.width){
                let widthDiff = wideSize.width - tallSize.width;
                let aspectDiff = wideSize.ratio - tallSize.ratio;
                let diffRatio = (wideSize.ratio - aspect) / aspectDiff;
                calcwidth = wideSize.width - widthDiff * diffRatio;
                calcheight = wideSize.height;
            }
            else if(tallSize.height !== wideSize.height){
                let heightDiff = tallSize.height - wideSize.height;
                let aspectDiff = wideSize.ratio - tallSize.ratio;
                let diffRatio = (aspect - tallSize.ratio) / aspectDiff;
                calcheight = tallSize.height - heightDiff * diffRatio;
                calcwidth = tallSize.width;
            }
            else{
                calcheight = tallSize.height;
                calcwidth = wideSize.width;
            }


            view.style.height = `${height}px`;
            view.style.width = `${width}px`;
            view.style.margin = '0';
        }
        let offset = (calcwidth - wideSize.width) * 0.5; // offset assumes that the upper left on MIN is 0,0 and the center is fixed
        let verticalOffset = (calcheight - tallSize.height) * 0.5;
        this.offset.x = offset;
        this.offset.y = verticalOffset;
        this.pixi.stage.position.copyFrom(this.offset);
        const newframe = {
            left: offset * -1,
            right: calcwidth - offset,
            width: calcwidth,
            center: calcwidth / 2 - offset,
            verticalCenter: calcheight / 2 - verticalOffset,
            top: 0,
            bottom: calcheight,
            height: calcheight,
            offset: this.offset,
            verticalOffset: verticalOffset
        };
        if(!this.viewFrame) {
            this.viewFrame = new Property(newframe);
        } else {
            this.viewFrame.value = newframe;
        }

        this.width = calcwidth;
        this.height = calcheight;

        /* legacy -- should remove */
        this.leftEdge = newframe.left;
        this.rightEdge = newframe.right;
        
        this.pixi.renderer.resize(calcwidth, calcheight);

        if (this._currentScene) {
          this._currentScene.resize(this.width,this.height,this.offset);
        }
    }


    /**
     * 
     * globalToScene converts a "global" from PIXI into the scene level, taking into account the offset based on responsive resize
     * 
     * @param pointin 
     */
    globalToScene(pointin:Point) {
        return {x:pointin.x - this.offset.x, y:pointin.y - this.offset.y};
    }

    addTimer(timer:PauseableTimer){
        console.warn('StageManager.prototype.addTimer() is deprecated. PauseableTimers manage themselves');
    }

    clearTimers() {
        console.warn('StageManager.prototype.clearTimers() is deprecated. use PauseableTimer.clearTimers() instead');
        PauseableTimer.clearTimers();
    }

    showCaption(captionid:string,begin?:number,args?:any) {
        if (this.isCaptionsMuted || !this.captions) { return; }
        begin = begin || 0;
        this.captions.start(captionid,begin,args);
    }

    stopCaption() {
        if(!this.captions){ return; }
        this.captions.stop();
    }

    update(){
        // if the game is paused, or there isn't a scene, we can skip rendering/updates  
        if (this.isPaused){
            return;
        }
        const elapsed = Ticker.shared.elapsedMS;
        if (this.captions) {
            this.captions.update(elapsed/1000); // captions go by seconds, not ms
        }
        GameTime.update(elapsed);
        if (this.transitioning || !this._currentScene){
            return;
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
    /** DEPRECATED */
    origin?:RectLike,
    min?:RectLike,
    max?:RectLike
};

export type ViewFrame = {
    left:number,
    right:number,
    top:number,
    bottom:number,
    center:number,
    verticalCenter:number,
    width:number,
    height:number,
    offset:Point
};
