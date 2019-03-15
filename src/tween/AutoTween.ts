
import Tween from './Tween'; 
import {Ease} from './Tween';
import GameTime from '../timer/GameTime';

/**
 * 
 * This is a Tween that automatically hooks itself to the game ticker 
 * 
 * 
 */

export default class AutoTween extends Tween {
  constructor(target:any, values:any, time:number, ease:Ease = 'linear') {
    super(target,values,time,ease);
    this.update = this.update.bind(this);
    this.listen(true);
  }

  destroy() {
    GameTime.gameTick.unsubscribe(this.update);
    super.destroy();
  }

   listen(yesorno:boolean) {
    if(yesorno === false) {  
      GameTime.gameTick.unsubscribe(this.update);
    } else {
      GameTime.gameTick.unsubscribe(this.update); // just to be sure
      GameTime.gameTick.subscribe(this.update);
    }
  }
}


