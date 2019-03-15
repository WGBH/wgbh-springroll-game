import { Ease } from './Tween';
export default class ChainTween {
    private _target;
    private _currenttween;
    private _tweenlist;
    constructor(target: any);
    static get(target: any): ChainTween;
    to(values: any, time?: number, ease?: Ease): this;
    nexttween: () => void;
    call(callback: Function, values?: any): this;
    wait(time: number): this;
    update: (time: number) => void;
    destroy(isComplete?: boolean): void;
    listen(yesorno: boolean): void;
}
