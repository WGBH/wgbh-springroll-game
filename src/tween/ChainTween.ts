
import Tween, { Ease } from './Tween';
import GameTime from '../timer/GameTime';
import PauseableTimer from '../timer/PauseableTimer';

/**
 * 
 * This is a Tween that automatically hooks itself to the game ticker 
 * 
 * 
 */


 type TweenConfig ={
   time?:number,
   values?:any,
   ease?:Ease,
   function?:Function,
   type:'timer'|'function'|'tween'
 };

export default class ChainTween {

  private _target:any;
  private _currenttween:Tween|PauseableTimer;
  private _tweenlist:Array<TweenConfig>;
  private _listeners:any;

  constructor(target:any) {
    this._target = target;
    this._tweenlist = [];
    this._listeners = {};
    this.listen(true);
  }

  static get(target:any) {
    return new ChainTween(target);
  }

  to(values:any,time:number = 0,ease:Ease = 'linear') {
    const tween:TweenConfig = {values:values,time:time,ease:ease,type:'tween'};
    this._tweenlist.push(tween);
    if(!this._currenttween) {
      this.nexttween();
    }
    return this;
  }

  nexttween = () => {
    if(this._currenttween) {
      this._currenttween.destroy();
      this._currenttween = null;
    }
    if(this._tweenlist.length < 1) {
      this.destroy();
      return;}
    const tweenconfig = this._tweenlist.shift();
    if(tweenconfig.type === "timer") {
      this._currenttween  = new PauseableTimer(this.nexttween,tweenconfig.time);
    } else if(tweenconfig.type === "function") {
      tweenconfig.function(tweenconfig.values);
      this.nexttween();
    } else {
      this._currenttween  = new Tween(this._target,tweenconfig.values,tweenconfig.time,tweenconfig.ease);
      this._currenttween.promise.then(this.nexttween,function() {/** */});
    }
  }

  call(callback:Function,values?:any) {
    //this._tweenlist.push(callback);
    // not empty
    const tween:TweenConfig = {function:callback,values:values,type:'function'};
    this._tweenlist.push(tween);
    if(!this._currenttween) {
      this.nexttween();
    }
    return this;
  }

  wait(time:number) {
    // not empty
    const tween:TweenConfig = {values:null,time:time,ease:null,type:'timer'};
    this._tweenlist.push(tween);
    if(!this._currenttween) {
      this.nexttween();
    }
    return this;
  }

  on(listentype:string,callback:Function) {
    if(listentype !== 'change') {return this;}
    if(!this._listeners[listentype]) {
      this._listeners[listentype] = [];
    }
    this._listeners[listentype].push(callback);
    return this;
  }

  update = (time:number) => {
    if(this._currenttween) {
      this._currenttween.update(time);
      for(let l in this._listeners) {
        for(let ll in this._listeners[l]) {
          this._listeners[l][ll]();
        }
      }
    }
  }

  destroy(isComplete = false) {
    GameTime.gameTick.unsubscribe(this.update);
    for(let l in this._listeners) {
      for(let ll in this._listeners[l]) {
        this._listeners[l][ll] = null;
      }
      delete(this._listeners[l]);
    }
    this._listeners = null;
    if(this._currenttween) {
      this._currenttween.destroy(false);
    }
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


