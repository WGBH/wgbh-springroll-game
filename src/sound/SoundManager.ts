import { SoundDescriptor } from "../assets/AssetManager";
import SoundContext from "./SoundContext";

export default class SoundManager {

    public sfx = new SoundContext();
    public vo = new SoundContext();
    public music = new SoundContext();

    private soundMeta: {[key:string]:SoundContext} = {};

    set volume(volume:number){
        this.sfx.globalVolume = volume; 
        this.vo.globalVolume = volume;
        this.music.globalVolume = volume;
    }

    set sfxVolume(volume:number){
        this.sfx.volume = volume;
    }

    set voVolume(volume:number){
        this.vo.volume = volume;
    }

    set musicVolume(volume:number){
        this.music.volume = volume;
    }

    addSound(sound:PIXI.sound.Sound, descriptor:SoundDescriptor){
        const context = this[descriptor.context || 'sfx'];
        this.soundMeta[descriptor.id] = context;
        context.addSound(sound, descriptor.id, descriptor.volume);
    }

    play(soundID:string, onComplete?:PIXI.sound.CompleteCallback){
        return this.soundMeta[soundID].sounds[soundID].play(onComplete);
    }

    getSound(soundID:string):PIXI.sound.Sound{
        return this.soundMeta[soundID].sounds[soundID];
    }

    pause(soundID?:string){
        if(!soundID){
            PIXI.sound.pauseAll();
        }
        else{
            this.soundMeta[soundID].sounds[soundID].resume();
        }
    }

    resume(soundID?:string){
        if(!soundID){
            PIXI.sound.resumeAll();
        }
        else{
            this.soundMeta[soundID].sounds[soundID].resume();
        }
    }

    setVolume(id:string, volume:number){
        this.soundMeta[id].applyVolume(id, volume);
    }

    removeSound(id:string){
        const context = this.soundMeta[id];
        context.removeSound(id);
        delete this.soundMeta[id];
    }

}