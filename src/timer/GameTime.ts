/**
 * 
 *  GameTime is a relay singleton that any object can hook into via its SpringRoll Property to get the next tick (gameTick) of the game clock.
 *  Its update() should be called on any live tick of the game; determining whether the tick is live (e.g. checking paused) should happen elsewhere.
 *  
 *  Call in the game's main tick/update function, using the singleton syntax on the class - GameTime.singleton.update(deltaTime);
 *  Subscribe to changes using singleton syntax on the class - GameTime.singleton.gameTick.subscribe(callbackfunction)
 *  
 */
import { Property } from "springroll";

let gtInstance:GameTime;

export default class GameTime {

    public gameTick: Property<number>;

    constructor() {
        this.gameTick = new Property(0);
    }

    update(deltaTime:number){
       this.gameTick.value = deltaTime;
    }

    static get singleton():GameTime {
        if (!gtInstance) {
            gtInstance = new GameTime();
        }
        return gtInstance;
    }

    destroy(){
        gtInstance = null;
    }
}
