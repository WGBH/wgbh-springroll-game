import * as eases from 'eases';
export default class Tween{
    public active = true;
    private currentTime = 0;
    private totalTime:number;

    private target:any;
    private initialValues:any = {};
    private targetValues:any;
    private ease: (t:number) => number;
    private onComplete: Function;

    private paused = false;

    constructor(target:any, values:any, time:number, complete?:Function, ease:Ease = 'linear'){
        this.target = target;
        this.targetValues = values;
        for(let key in this.targetValues){
            this.initialValues[key] = this.target[key];
        }
        this.totalTime = time;
        const Eases:typeof eases = (eases as any).default;
        this.ease = Eases[ease];
        if(!this.ease){
            console.error(`No ease found with name ${ease}`);
            this.ease = Eases.linear;
        }

        this.onComplete = complete;
    }

    pause(pause:boolean){
        this.paused = pause;
    }

    update(deltaTime:number){
        if(this.paused){
            return;
        }
        this.currentTime += deltaTime;
        const time = this.currentTime / this.totalTime > 1 ? 1 : this.currentTime / this.totalTime;
        for(let key in this.targetValues){
            this.target[key] = this.initialValues[key] + this.ease(time) * (this.targetValues[key] - this.initialValues[key]);
        }

        if(time >= 1){
            if(this.onComplete){
                this.onComplete();
            }
            this.destroy();
        }
    }

    destroy(){
        this.active = null;
        this.target = null;
        this.targetValues = null;
        this.totalTime = null;
        this.ease = null;
        this.onComplete = null;
    }
}

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