export default class PauseableTimer {
    active: boolean;
    private currentTime;
    private targetTime;
    private paused;
    private onComplete;
    private repeat;
    promise: Promise<void>;
    private resolve;
    private reject;
    constructor(callback: Function, time: number, loop?: boolean);
    pause(pause: boolean): void;
    reset(deltaTime: number): void;
    update: (deltaTime: number) => void;
    destroy(isComplete?: boolean): void;
}
