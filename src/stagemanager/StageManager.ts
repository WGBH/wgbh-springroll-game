import Scene from './Scene';


export default class StageManager{

    public curtains:PIXI.animate.MovieClip;
    private _currentScene:Scene;

    constructor(transition:PIXI.animate.MovieClip){
        this.hangCurtains(transition);
    }

    get currentScene(){
        return this._currentScene;
    }

    hangCurtains(curtains:PIXI.animate.MovieClip){
        const curtainLabels = [
            'cover',
            'cover_stop',
            'load',
            'load_loop',
            'reveal',
            'reveal_stop'
        ];
        for(let label of curtainLabels){
            if(!curtains.labelsMap.hasOwnProperty(label)){
                console.error('Curtain MovieClip missing label: ', label);
                return;
            }
        }
        this.curtains = curtains;
        this.curtains.gotoAndStop('cover');
    }

    changeScene(scene:Scene){
        //blah
    }

}