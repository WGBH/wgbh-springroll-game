import AssetManager from "./assetmanager/AssetManager";

export default class Game{

    public assets = new AssetManager();

    constructor(){
        console.warn('we got constructed');
        console.warn('app', PIXI.Application);
    }

    init(){
        console.warn('we got initted');
    }
}