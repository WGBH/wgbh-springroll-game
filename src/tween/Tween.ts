import * as eases from 'eases';

const Eases:typeof eases = (eases as any).default;

export default class Tween{

    static tweens:Tween[] = [];


    public paused = false;

    private target:any;
    private steps:TweenStep[] = [];
    private currentStep:number = 0;
    private loop:number = 0;
    private onComplete:Function;
    

    private _promise:Promise<void>;
    private _resolve:Function;


    constructor(target:any){
        this.target = target;
    }

    static get(target:any, options:TweenOptions = {}):Tween{
        if(options.override){
            this.removeTweens(target);
        }
        const tween = new Tween(target);
        if(options.loop){
            if(options.loop % 1){
                console.error('Tween options.loop must be an integer. Got: ', options.loop);
            }
            tween.loop = options.loop;
        }
        if(options.onComplete){
            tween.onComplete = options.onComplete;
        }
        Tween.tweens.push(tween);
        return tween;
    }

    static removeTweens(target:any){
        for(let i = Tween.tweens.length - 1; i >= 0; i--){
            if(Tween.tweens[i].target === target){
                Tween.tweens[i].destroy();
            }
        }
    }

    static removeAllTweens(){
        for(let i = Tween.tweens.length - 1; i >= 0; i--){
            Tween.tweens[i].destroy();
        }
    }

    to = (targetValues:any, totalTime:number, ease:Ease = 'linear') => {
        this.steps.push({targetValues, totalTime, ease:Eases[ease]});
        return this;
    }

    wait = (totalTime:number) => {
        this.steps.push({totalTime});
        return this;
    }

    call = (call:Function) => {
        this.steps.push({call});
        return this;
    }

    get promise():Promise<void>{
        if(!this._promise){
            this._promise = new Promise((resolve)=>{this._resolve = resolve;});
        }
        return this._promise;
    }

    private doComplete = () => {
        if(this.onComplete){
            this.onComplete();
        }
        if(this._resolve){
            this._resolve();
        }
        this.destroy();
    }

    static update(elapsed:number){
        if(Tween.tweens.length){
            for(let tween of Tween.tweens){
                tween.update(elapsed);
            }
        }
    }

    update = (elapsed:number) => {
        if(this.paused){
            return;
        }
        if(this.steps.length <= this.currentStep){
            if(this.loop){
                if(this.loop > 0){
                    this.loop--;
                }
                this.currentStep = 0;
            }
            else{
                return this.doComplete();
            }
        }
        const step = this.steps[this.currentStep];
        if(step.call){
            this.currentStep++;
            return step.call();
        }
        if(!step.currentTime){
            step.currentTime = 0;
            if(step.targetValues){
                step.initialValues = {};
                for(let key in step.targetValues){
                    step.initialValues[key] = this.target[key];
                }
            }
        }
        step.currentTime += elapsed;
        const time = step.currentTime / step.totalTime > 1 ? 1 : step.currentTime / step.totalTime;
        if(step.targetValues){
            for(let key in step.targetValues){
                this.target[key] = step.initialValues[key] + step.ease(time) * (step.targetValues[key] - step.initialValues[key]);
            }
        }

        if(time >= 1){
            this.currentStep++;
        }
    }

    destroy(){
        Tween.tweens.splice(Tween.tweens.indexOf(this), 1);
        this.target = null;
        this.steps = null;
        this.currentStep = null;
        this._promise = null;
        this._resolve = null;
    }
}

export type TweenStep  = {
    targetValues?:any;
    initialValues?:any;
    currentTime?:number;
    totalTime?:number;
    ease?:(t:number) => number;
    call?:Function;
};

export type TweenOptions = {
    override?:boolean;
    loop?:number;
    onComplete?:Function;
};

export type Ease = 
    'backInOut' |
    'backIn' |
    'backOut' |
    'bounceInOut' |
    'bounceIn' |
    'bounceOut' |
    'circInOut' |
    'circIn' |
    'circOut' |
    'cubicInOut' |
    'cubicIn' |
    'cubicOut' |
    'elasticInOut' |
    'elasticIn' |
    'elasticOut' |
    'expoInOut' |
    'expoIn' |
    'expoOut' |
    'linear' |
    'quadInOut' |
    'quadIn' |
    'quadOut' |
    'quartInOut' |
    'quartIn' |
    'quartOut' |
    'quintInOut' |
    'quintIn' |
    'quintOut' |
    'sineInOut' |
    'sineIn' |
    'sineOut';