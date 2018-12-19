import Game from '../Game';

/**
 * Generic Scene base class
 */
export default class Scene extends PIXI.Container {
    public game:Game;
  
    constructor(game:Game) {
        super();
        this.game = game;
    }

    /**
     * asynchronous load tasks
     * @returns {Promise}
     */
    preload():Promise<any> {
        //Override this if you have stuff to preload - don't call super(), return your own Promise
        // add assets, and load them. Resolve a promise when it's all done
        return Promise.resolve();
      }

    /**
     * prepare initial visual state - called after preload is complete, while scene is obscured by loader
     */
    setup(){
        //override this, called to prepare graphics
    }
    
    /**
     * entrypoint to scene - called after loader transition is complete
     */
    start() {
        //override this - called to start scene
    }

    /**
     * callback for frame ticks
     * @param {number} deltaTime time since last frame in multiples of one frame's length of time.
     */
    update(deltaTime:number) {
        //override this to get update ticks
    }

    cleanup():Promise<any>|void {
        return Promise.reject('CLEANUP YOUR OWN STUFF!');
    }
}