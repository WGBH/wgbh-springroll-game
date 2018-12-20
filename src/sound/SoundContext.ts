export default class SoundContext {

    public sounds: {[key:string]: PIXI.sound.Sound} = {};
    private volumes: {[key:string]: number} = {};

    private _globalVolume:number = 1;
    private _volume:number = 1;

    set volume(volume:number){
        this._volume = volume;
        for(let key in this.sounds){
            this.applyVolume(key);
        }
    }

    set globalVolume(volume:number){
        this._globalVolume = volume;
        for(let key in this.sounds){
            this.applyVolume(key);
        }
    }

    addSound(sound:PIXI.sound.Sound, id:string, volume:number = 1){
        this.sounds[id] = sound;
        this.volumes[id] = volume;
        this.applyVolume(id);
    }

    applyVolume(id:string, volume?:number){
        if(volume !== undefined){
            this.volumes[id] = volume;
        }
        this.sounds[id].volume = this.volumes[id] * this._globalVolume * this._volume;
    }

    removeSound(id:string){
        PIXI.sound.remove(id);
        delete this.sounds[id];
        delete this.volumes[id];
    }

}