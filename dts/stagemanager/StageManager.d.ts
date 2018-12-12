import Scene from './Scene';
export default class StageManager {
    curtains: PIXI.animate.MovieClip;
    private _currentScene;
    constructor(transition: PIXI.animate.MovieClip);
    readonly currentScene: Scene;
    hangCurtains(curtains: PIXI.animate.MovieClip): void;
    changeScene(scene: Scene): void;
}
