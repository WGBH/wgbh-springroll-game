/**
 *
 *  GameTime is a relay singleton that any object can hook into via its SpringRoll Property to get the next tick (gameTick) of the game clock.
 *  Its update() should be called on any live tick of the game; determining whether the tick is live (e.g. checking paused) should happen elsewhere.
 *
 *  Call in the game's main tick/update function, using the singleton syntax on the class - GameTime.Instance.update(deltaTime);
 *  Subscribe to changes using singleton syntax on the class - GameTime.Instance.gameTick.subscribe(callbackfunction)
 *
 */
import { Property } from "springroll";
export default class GameTime {
    static listeners: ((elapsed?: number) => any)[];
    /**
     * @deprecated use GameTime.subscribe() and GameTime.unsubscribe() directly instead
     */
    static gameTick: Property<number>;
    static update(deltaTime: number): void;
    /**
     * Adds an update listener
     * @param {function} callback The listener to call every frame update
     */
    static subscribe(callback: (elapsed?: number) => any): void;
    /**
     * Removes an update listener
     * @param {function} callback The listener to unsubscribe.
     */
    static unsubscribe(callback: (elapsed?: number) => any): void;
    static destroy(): void;
}
