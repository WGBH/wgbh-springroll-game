import * as SpringRoll from 'springroll';

import AssetManager from "./assets/AssetManager";
import SceneManager from "./scenes/SceneManager";
import SoundManager from './sound/SoundManager';

export default class Game {

    public app: SpringRoll.Application;

    public assets:AssetManager;
    public scenes: SceneManager;
    public sound: SoundManager;

    constructor(){
        this.sound = new SoundManager();
        this.assets = new AssetManager(this.sound);
    }

    init(){
        console.warn('we got initted');
    }
}