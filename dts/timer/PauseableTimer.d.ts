export default class PauseableTimer {
    static timers: PauseableTimer[];
    active: boolean;
    private currentTime;
    private targetTime;
    private paused;
    private onComplete;
    private repeat;
    private _promise;
    private resolve;
    private reject;
    constructor(callback: Function, time: number, loop?: boolean);
    static clearTimers(): void;
    readonly promise: Promise<void>;
    pause(pause: boolean): void;
    reset(deltaTime: number): void;
    update: (deltaTime: number) => void;
    destroy(isComplete?: boolean): void;
}
