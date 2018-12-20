/// <reference types="pixi.js" />
/// <reference types="pixi-animate" />
import Scene from './Scene';
import AssetManager, { AnimateStage } from '../assets/AssetManager';
export default class StageManager {
    pixi: PIXI.Application;
    width: number;
    height: number;
    transition: PIXI.animate.MovieClip;
    private _currentScene;
    private assetManager;
    private transitioning;
    private isPaused;
    constructor(assetManager: AssetManager, containerID: string, width: number, height: number);
    init(transition: AnimateStage, firstScene: Scene): void;
    scene: Scene;
    setTransition(stage: AnimateStage, callback: Function): void;
    changeScene: (newScene: Scene) => void;
    pause: boolean;
    update(deltaTime: number): void;
}
