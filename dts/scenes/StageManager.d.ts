import Scene from './Scene';
import { Game } from '..';
import PauseableTimer from '../timer/PauseableTimer';
import { ScaleManager, CaptionPlayer, CaptionData, IRender, Property } from 'springroll';
import { Application } from '@pixi/app';
import { Point } from '@pixi/math';
import { AnimateAsset, MovieClip } from '@pixi/animate';
/**
 * Manages rendering and transitioning between Scenes
 */
export default class StageManager {
    pixi: Application;
    width: number;
    height: number;
    offset: Point;
    transition: MovieClip;
    viewFrame: Property<ViewFrame>;
    leftEdge: number;
    rightEdge: number;
    scaleManager: ScaleManager;
    private _currentScene;
    private _minSize;
    private _maxSize;
    private transitioning;
    private isPaused;
    private game;
    captions: CaptionPlayer;
    private isCaptionsMuted;
    /** Map of Scenes by Scene IDs */
    private scenes;
    get scale(): number;
    get currentScene(): Scene;
    constructor(game: Game);
    createRenderer(containerID: string, width: number, height: number, altWidth?: number, altHeight?: number, playOptions?: any & {
        cordova?: string;
        platform?: string;
        model?: string;
        osVersion?: string;
    }): void;
    addCaptions(captionData: CaptionData, renderer: IRender): void;
    setCaptionRenderer(renderer: IRender): void;
    addScene(id: string, scene: typeof Scene): void;
    addScenes(sceneMap: {
        [key: string]: typeof Scene;
    }): void;
    setTransition(asset: AnimateAsset, callback: Function): void;
    /**
     * Transition to specified scene
     * @param {string} sceneID ID of Scene to transition to
     */
    changeScene: (newScene: string) => void;
    get captionsMuted(): boolean;
    set captionsMuted(muted: boolean);
    get pause(): boolean;
    set pause(pause: boolean);
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
    globalToScene(pointin: Point): {
        x: number;
        y: number;
    };
    addTimer(timer: PauseableTimer): void;
    clearTimers(): void;
    showCaption(captionid: string, begin?: number, args?: any): void;
    stopCaption(): void;
    update(): void;
}
export type ScreenSize = {
    width: number;
    height: number;
    ratio: number;
};
export type RectLike = {
    width: number;
    height: number;
};
export type ScaleConfig = {
    /** DEPRECATED */
    origin?: RectLike;
    min?: RectLike;
    max?: RectLike;
};
export type ViewFrame = {
    left: number;
    right: number;
    top: number;
    bottom: number;
    center: number;
    verticalCenter: number;
    width: number;
    height: number;
    offset: Point;
};
