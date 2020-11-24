
/**
 * Generic Curtain base class, for extending. 
 * 
 * Requires
 */
import * as PIXI from "pixi.js";
import {AssetList,AssetCache} from "../assets/AssetManager";
import { Property } from "springroll";
import { StageManager } from "..";

export interface BaseCurtain {
    assetsToLoad(arg?:any):AssetList; // returns an asset list
    init(stagemanager:StageManager,cache:AssetCache):boolean; // called after assets are loaded, sending asset cache for lookups; returns success
    open(callback:Function):void; // start curtain's "opening" sequence
    close(callback:Function):void; // start curtain's "closing" sequence
    loading():void; // start curtain's "loading" sequence/loop
    cover():void; // set curtain at the "middle" point, instantly covering scene
    hide(mainstage:PIXI.Container):void; // remove from stage
    add(mainstage:PIXI.Container):void; // add to the stage to be ready to close curtain
    progress(pct:number):void; // call from outside to update any progress meter
    status:Property<string>;
    stageManager:StageManager;
}
 
export default class Curtain implements BaseCurtain {
    public status = new Property("closed");
    public stageManager:StageManager;

    constructor() {
    }

    assetsToLoad(arg?:any):AssetList {
        return null;
    }

    open(callback:Function):void {
        this.status.value = "opening";
        this.status.value = "open";
        callback();
    }

    close(callback:Function):void {
        this.status.value = "closing";
        this.status.value = "closed";
        callback();
    }

    cover() {
        this.status.value = "closed";
    }

    add(mainstage:PIXI.Container) {

    }

    init(stagemanager:StageManager,cache:AssetCache):boolean {
        this.stageManager = stagemanager;
        return true;
    }

    loading() {
        this.status.value = "loading";
    }

    hide(mainstage:PIXI.Container) {
        this.status.value = "hidden";
    }
    progress(pct:number) {
        // progress = pct
    }
}