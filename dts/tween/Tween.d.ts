export default class Tween {
    static tweens: Tween[];
    paused: boolean;
    private target;
    private steps;
    private currentStep;
    private loop;
    private onComplete;
    private _promise;
    private _resolve;
    constructor(target: any);
    static get(target: any, options?: TweenOptions): Tween;
    static removeTweens(target: any): void;
    to: (targetValues: any, totalTime: number, ease?: Ease) => this;
    wait: (totalTime: number) => this;
    call: (call: Function) => this;
    readonly promise: Promise<void>;
    private doComplete;
    static update(elapsed: number): void;
    update: (elapsed: number) => any;
    destroy(): void;
}
export declare type TweenStep = {
    targetValues?: any;
    initialValues?: any;
    currentTime?: number;
    totalTime?: number;
    ease?: (t: number) => number;
    call?: Function;
};
export declare type TweenOptions = {
    override?: boolean;
    loop?: number;
    onComplete?: Function;
};
export declare type Ease = 'backInOut' | 'backIn' | 'backOut' | 'bounceInOut' | 'bounceIn' | 'bounceOut' | 'circInOut' | 'circIn' | 'circOut' | 'cubicInOut' | 'cubicIn' | 'cubicOut' | 'elasticInOut' | 'elasticIn' | 'elasticOut' | 'expoInOut' | 'expoIn' | 'expoOut' | 'linear' | 'quadInOut' | 'quadIn' | 'quadOut' | 'quartInOut' | 'quartIn' | 'quartOut' | 'quintInOut' | 'quintIn' | 'quintOut' | 'sineInOut' | 'sineIn' | 'sineOut';
