
import GameTime from '../timer/GameTime';
import { Tween, Ease, TweenProps } from '@createjs/tweenjs';

export class CJSTween extends Tween {

  static _listening:boolean = false;
  static autoTick:boolean = true;

  constructor(target:any,props?:TweenProps) {
    super(target,props);
    if(!CJSTween._listening && CJSTween.autoTick) {
      CJSTween.listen(true);
    }
  }

  /**
   * 
   * The 'get' method works like the TweenJS Tween.get() method.
   * 
   * @param target Target object of the tween
   * @param props Properties of the tween, see documentation for the CreateJS TweenJS 
   */
  static get(target:any,props?:TweenProps):CJSTween { // overriding the parent method
    return new CJSTween(target,props);
  }
  
  /**
   * 
   * This will pass the tick time over to the CreateJS TweenJS tick() function
   * 
   * @param deltaTime Time in MS
   */
  static tick(deltaTime:number) {
    Tween.tick(deltaTime,false);
  }

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
  static listen(yesorno:boolean) {
    if(yesorno === false) {
      CJSTween._listening = false;      
      GameTime.gameTick.unsubscribe(CJSTween.tick);
    } else {
      CJSTween._listening = true;
      GameTime.gameTick.unsubscribe(CJSTween.tick); // just to be sure
      GameTime.gameTick.subscribe(CJSTween.tick);
    }
  }
}

Tween._inited = true;

export class CJSEase extends Ease {
    
}
