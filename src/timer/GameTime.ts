/**
 * 
 *  GameTime is a relay singleton that any object can hook into via its static subscribe() method to get the next tick of the game clock.
 *  Its update() should be called on any live tick of the game; determining whether the tick is live (e.g. checking paused) should happen elsewhere.
 *  
 *  Call in the game's main tick/update function, using the static method on the class - GameTime.update(deltaTime);
 *  Subscribe to changes using static method on the class - GameTime.subscribe(callbackfunction)
 *  
 */
import { Property } from "springroll";


export default class GameTime {

    static listeners:((elapsed?:number)=>any)[] = [];

    /**
     * @deprecated use GameTime.subscribe() and GameTime.unsubscribe() directly instead
     */
    static gameTick: Property<number> = new Property(0, true);

    static update(deltaTime:number){
        for (let i = 0; i < this.listeners.length; i++) {
            this.listeners[i](deltaTime);
        }

        if(GameTime.gameTick.hasListeners){
            GameTime.gameTick.value = deltaTime;
        }
    }

    /**
     * Adds an update listener
     * @param {function} callback The listener to call every frame update
     */
    static subscribe(callback:(elapsed?:number)=>any) {
      GameTime.listeners.push(callback);
    }
  
    /**
     * Removes an update listener
     * @param {function} callback The listener to unsubscribe.
     */
    static unsubscribe(callback:(elapsed?:number)=>any) {
      GameTime.listeners = GameTime.listeners.filter(listener => listener !== callback);
    }

    static destroy(){
        GameTime.listeners.length = 0;
        GameTime.gameTick.value = null;
    }
}
