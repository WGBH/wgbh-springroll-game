import { Tween, Ease, TweenProps } from '@createjs/tweenjs';
export declare class CJSTween extends Tween {
    static _listening: boolean;
    static autoTick: boolean;
    constructor(target: any, props?: TweenProps);
    /**
     *
     * The 'get' method works like the TweenJS Tween.get() method.
     *
     * @param target Target object of the tween
     * @param props Properties of the tween, see documentation for the CreateJS TweenJS
     */
    static get(target: any, props?: TweenProps): CJSTween;
    /**
     *
     * This will pass the tick time over to the CreateJS TweenJS tick() function
     *
     * @param deltaTime Time in MS
     */
    static tick(deltaTime: number): void;
    /**
     *
     * If you want all tweens to listen to the GameTime's ticker (this is the default), this should be true.
     *
     * If you don't want all tweens hooked up to GameTime, call CJSTween.listen(false) before using any Tweens.
     *
     * If it's set to false, you can update your tweens directly with the static CJSTween.tick(deltaTime) method.
     *
     * @param yesorno listen or don't
     */
    static listen(yesorno: boolean): void;
}
export declare class CJSEase extends Ease {
}
