/// <reference types="pixi-animate" />
import Scene from './Scene';
import { AnimateStage } from '../assets/AssetManager';
import { Game } from '..';
import Tween from '../tween/Tween';
import PauseableTimer from '../timer/PauseableTimer';
import { PointLike } from 'pixi.js';
import { CaptionData, IRender } from 'springroll';
/**
 * Manages rendering and transitioning between Scenes
 */
export default class StageManager {
    pixi: PIXI.Application;
    width: number;
    height: number;
    scale: number;
    offset: PointLike;
    leftEdge: number;
    rightEdge: number;
    transition: PIXI.animate.MovieClip;
    private _currentScene;
    private scaleManager;
    private _minSize;
    private _maxSize;
    private _originSize;
    private transitioning;
    private isPaused;
    private game;
    private captions;
    /** Map of Scenes by Scene IDs */
    private scenes;
    private tweens;
    private timers;
    constructor(game: Game, containerID: string, width: number, height: number, altWidth?: number);
    addCaptions(captionData: CaptionData, renderer: IRender): void;
    setCaptionRenderer(renderer: IRender): void;
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
    getSize(width: number, height: number): ScreenSize;
    setScaling(scaleconfig: ScaleConfig): void;
    gotResize: (newsize: ScreenSize) => void;
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
    showCaption(captionid: string, begin?: number, args?: any): void;
    stopCaption(): void;
    update(): void;
}
export declare type ScreenSize = {
    width: number;
    height: number;
    ratio: number;
};
export declare type RectLike = {
    width: number;
    height: number;
};
export declare type ScaleConfig = {
    origin?: RectLike;
    min?: RectLike;
    max?: RectLike;
};
