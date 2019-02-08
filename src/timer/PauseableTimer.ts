import GameTime from "./GameTime";

export default class PauseableTimer {

    public active = true;

    private currentTime:number;
    private targetTime:number;
    private paused:boolean = false;
    private onComplete:Function;
    private repeat:boolean = false;

    constructor(callback:Function, time:number, loop?:boolean) {
        this.targetTime = time;
        this.currentTime = 0;
        this.onComplete = callback;
        
        this.repeat = loop;
        GameTime.gameTick.subscribe(this.update);
    }

    pause(pause:boolean){
        this.paused = pause;
    }

    reset(deltaTime:number) {
        // deltaTime shows how far over the end we went = do we care?
        this.currentTime = deltaTime ? deltaTime : 0;
    }

    update = (deltaTime:number) => {
        if(this.paused){
            return;
        }

        this.currentTime += deltaTime;
        const time = this.currentTime / this.targetTime > 1 ? 1 : this.currentTime / this.targetTime;

        if(time >= 1){
            if (this.onComplete) {
                this.onComplete();
            }
            if (this.repeat) {
                const delta = this.currentTime - this.targetTime;
                this.reset(delta);
            } else {
                this.destroy(true);
            }
        }
    }

    destroy(isComplete = false){
        this.targetTime = null;
        GameTime.gameTick.unsubscribe(this.update);
    }
}
