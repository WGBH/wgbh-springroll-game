/// <reference types="pixi-animate" />
/// <reference types="pixi.js" />
import Curtain from './Curtain';
import { AssetList, AssetCache, AnimateStage } from "../assets/AssetManager";
import { StageManager } from '..';
/**
 * Animate Curtain
 */
export default class CurtainAnimate extends Curtain {
    stage: AnimateStage;
    transition: PIXI.animate.MovieClip;
    id: string;
    constructor(stage: AnimateStage, id: string);
    assetsToLoad(arg?: any): AssetList;
    close(callback: Function): void;
    open(callback: Function): void;
    init(stagemanager: StageManager, cache: AssetCache): boolean;
    cover(): void;
    add(mainstage: PIXI.Container): void;
    hide(mainstage: PIXI.Container): void;
    loading(): void;
    progress(pct: number): void;
}
