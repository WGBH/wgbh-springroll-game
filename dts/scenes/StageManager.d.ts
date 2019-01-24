/// <reference types="pixi.js" />
/// <reference types="pixi-animate" />
import Scene from './Scene';
import { AnimateStage } from '../assets/AssetManager';
import { Game } from '..';
import Tween from '../tween/Tween';
import PauseableTimer from '../timer/PauseableTimer';
/**
 * Manages rendering and transitioning between Scenes
 */
export default class StageManager {
    pixi: PIXI.Application;
    width: number;
    height: number;
    transition: PIXI.animate.MovieClip;
    private _currentScene;
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
    addTween(tween: Tween): void;
    clearTweens(): void;
    addTimer(timer: PauseableTimer): void;
    clearTimers(): void;
    update(): void;
}
