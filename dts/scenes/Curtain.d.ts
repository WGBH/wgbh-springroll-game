/**
 * Generic Curtain base class, for extending.
 *
 * Requires
 */
import * as PIXI from "pixi.js";
import { AssetList, AssetCache } from "../assets/AssetManager";
import { Property } from "springroll";
import { StageManager } from "..";
export interface BaseCurtain {
    assetsToLoad(arg?: any): AssetList;
    init(stagemanager: StageManager, cache: AssetCache): boolean;
    open(callback: Function): void;
    close(callback: Function): void;
    loading(): void;
    cover(): void;
    hide(mainstage: PIXI.Container): void;
    add(mainstage: PIXI.Container): void;
    progress(pct: number): void;
    status: Property<string>;
    stageManager: StageManager;
}
export default class Curtain implements BaseCurtain {
    status: Property<string>;
    stageManager: StageManager;
    constructor();
    assetsToLoad(arg?: any): AssetList;
    open(callback: Function): void;
    close(callback: Function): void;
    cover(): void;
    add(mainstage: PIXI.Container): void;
    init(stagemanager: StageManager, cache: AssetCache): boolean;
    loading(): void;
    hide(mainstage: PIXI.Container): void;
    progress(pct: number): void;
}
