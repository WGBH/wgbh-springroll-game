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
    static removeAllTweens(): void;
    to: (targetValues: any, totalTime: number, ease?: Ease) => this;
    wait: (totalTime: number) => this;
    call: (call: Function) => this;
    get promise(): Promise<void>;
    private doComplete;
    update: (elapsed: number) => any;
    destroy(): void;
}
export type TweenStep = {
    targetValues?: any;
    initialValues?: any;
    currentTime?: number;
    totalTime?: number;
    ease?: (t: number) => number;
    call?: Function;
};
export type TweenOptions = {
    override?: boolean;
    loop?: number;
    onComplete?: Function;
};
export type Ease = 'backInOut' | 'backIn' | 'backOut' | 'bounceInOut' | 'bounceIn' | 'bounceOut' | 'circInOut' | 'circIn' | 'circOut' | 'cubicInOut' | 'cubicIn' | 'cubicOut' | 'elasticInOut' | 'elasticIn' | 'elasticOut' | 'expoInOut' | 'expoIn' | 'expoOut' | 'linear' | 'quadInOut' | 'quadIn' | 'quadOut' | 'quartInOut' | 'quartIn' | 'quartOut' | 'quintInOut' | 'quintIn' | 'quintOut' | 'sineInOut' | 'sineIn' | 'sineOut';
