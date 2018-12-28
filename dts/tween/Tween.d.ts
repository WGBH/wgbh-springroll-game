export default class Tween {
    active: boolean;
    private currentTime;
    private totalTime;
    private target;
    private initialValues;
    private targetValues;
    private ease;
    private onComplete;
    private paused;
    constructor(target: any, values: any, time: number, complete?: Function, ease?: Ease);
    pause(pause: boolean): void;
    update(deltaTime: number): void;
    destroy(): void;
}
export declare type Ease = 'backInOut' | 'backIn' | 'backOut' | 'bounceInOut' | 'bounceIn' | 'bounceOut' | 'circInOut' | 'circIn' | 'circOut' | 'cubicInOut' | 'cubicIn' | 'cubicOut' | 'elasticInOut' | 'elasticIn' | 'elasticOut' | 'expoInOut' | 'expoIn' | 'expoOut' | 'linear' | 'quadInOut' | 'quadIn' | 'quadOut' | 'quartInOut' | 'quartIn' | 'quartOut' | 'quintInOut' | 'quintIn' | 'quintOut' | 'sineInOut' | 'sineIn' | 'sineOut';
