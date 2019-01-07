export default class Tween {
    promise: Promise<void>;
    active: boolean;
    private currentTime;
    private totalTime;
    private target;
    private initialValues;
    private targetValues;
    private ease;
    private paused;
    private resolve;
    private reject;
    constructor(target: any, values: any, time: number, ease?: Ease);
    pause(pause: boolean): void;
    update(deltaTime: number): void;
    destroy(isComplete?: boolean): void;
}
export declare type Ease = 'backInOut' | 'backIn' | 'backOut' | 'bounceInOut' | 'bounceIn' | 'bounceOut' | 'circInOut' | 'circIn' | 'circOut' | 'cubicInOut' | 'cubicIn' | 'cubicOut' | 'elasticInOut' | 'elasticIn' | 'elasticOut' | 'expoInOut' | 'expoIn' | 'expoOut' | 'linear' | 'quadInOut' | 'quadIn' | 'quadOut' | 'quartInOut' | 'quartIn' | 'quartOut' | 'quintInOut' | 'quintIn' | 'quintOut' | 'sineInOut' | 'sineIn' | 'sineOut';
