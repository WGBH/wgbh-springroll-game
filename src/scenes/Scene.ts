import Game from '../Game';
import { AssetList } from '..';

/**
 * Generic Scene base class, parent container for all art and functionality in a given scene
 */
export default class Scene extends PIXI.Container {
    /** reference to main Game instance */
    protected game:Game;
  
    constructor(game:Game) {
        super();
        this.game = game;
    }

    /**
     * provide list of assets to preload
     * @returns {AssetList}
     */
    preload():AssetList {
        return;
    }

    /**
     * Exit this Scene and transition to specified scene
     * @param {string} sceneID ID of Scene to transition to
     */
    changeScene(sceneID:string){
        this.game.changeScene(sceneID);
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

    /**
     * Called when Scene is about to transition out - override to clean up art or other objects in memory
     * @returns {Promise | void} return a Promise to resolve when any asynchronous cleanup is complete
     */
    cleanup():Promise<any>|void {
        //override this to clean up Scene
    }
}