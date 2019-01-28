
export default class PauseableTimer {

    public active = true;

    private currentTime:number;
    private targetTime:number;
    private paused:boolean = true;
    private onComplete:Function;
    private repeat:boolean = false;


    public promise: Promise<void>;
    private resolve:Function;
    private reject:Function;

    constructor(callback:Function, time:number, loop?:boolean) {
        this.targetTime = time;
        this.currentTime = 0;
        this.onComplete = callback;
        
        this.repeat = loop;

        this.promise = new Promise((resolve, reject)=>{
            this.resolve = resolve;
            this.reject = reject;
        });
    }

    pause(pause:boolean){
        this.paused = pause;
    }

    reset(deltaTime:number) {
        // deltaTime shows how far over the end we went = do we care?
        this.currentTime = deltaTime ? deltaTime : 0;
    }

    update(deltaTime:number){
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
        isComplete ? this.resolve() : this.reject('destroyed');
        this.promise = null;
        this.resolve = null;
        this.reject = null;
        this.targetTime = null;
    }
}
