/// <reference types="pixi-animate" />
import Scene from './Scene';
import { AnimateStage } from '../assets/AssetManager';
import { Game } from '..';
import Tween from '../tween/Tween';
import PauseableTimer from '../timer/PauseableTimer';
import { PointLike } from 'pixi.js';
/**
 * Manages rendering and transitioning between Scenes
 */
export default class StageManager {
    pixi: PIXI.Application;
    width: number;
    height: number;
    scale: number;
    offset: PointLike;
    transition: PIXI.animate.MovieClip;
    private _currentScene;
    private scalemanager;
    private _minsize;
    private _maxsize;
    private _originsize;
    private transitioning;
    private isPaused;
    private game;
    /** Map of Scenes by Scene IDs */
    private scenes;
    private tweens;
    private timers;
    constructor(game: Game, containerID: string, width: number, height: number);
    addScene(id: string, scene: typeof Scene): void;
    addScenes(sceneMap: {
        [key: string]: typeof Scene;
    }): void;
    setTransition(stage: AnimateStage, callback: Function): void;
    /**
     * Transition to specified scene
     * @param {string} sceneID ID of Scene to transition to
     */
    changeScene: (newScene: string) => void;
    pause: boolean;
    getsize(width: number, height: number): Screensize;
    setscaling(origin: Rectlike, min: Rectlike, max: Rectlike): void;
    gotresize(newsize: Screensize): void;
    resize(width: number, height: number): void;
    /**
     *
     * globalToScene converts a "global" from PIXI into the scene level, taking into account the offset based on responsive resize
     *
     * @param pointin
     */
    globalToScene(pointin: PointLike): {
        x: number;
        y: number;
    };
    addTween(tween: Tween): void;
    clearTweens(): void;
    addTimer(timer: PauseableTimer): void;
    clearTimers(): void;
    update(): void;
}
export declare type Screensize = {
    width: number;
    height: number;
    ratio: number;
};
export declare type Rectlike = {
    width: number;
    height: number;
};
