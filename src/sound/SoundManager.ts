import { SoundDescriptor } from "../assets/AssetManager";
import SoundContext from "./SoundContext";


/**
 * Manages Sound playback, pausing, resuming, and volume control
 */
export default class SoundManager {

    /** Context for managing SFX sounds */
    public sfx = new SoundContext();
    /** Context for managing VO sounds */
    public vo = new SoundContext();
    /** Context for managing music sounds */
    public music = new SoundContext();
    /** Mapping of which SoundContexts each Sound belongs to, by ID */
    private soundMeta: {[key:string]:SoundContext} = {};

    /** Global volume of all SoundContexts */
    set volume(volume:number){
        this.sfx.globalVolume = volume; 
        this.vo.globalVolume = volume;
        this.music.globalVolume = volume;
    }

    /** Volume of all sounds in SFX context */
    set sfxVolume(volume:number){
        this.sfx.volume = volume;
    }

    /** Volume of all sounds in VO context */
    set voVolume(volume:number){
        this.vo.volume = volume;
    }

    /** Volume of all sounds in Music context */
    set musicVolume(volume:number){
        this.music.volume = volume;
    }

    /**
     * Add sound to a SoundManager Context
     * @param {Sound} sound Sound instance to add
     * @param {SoundDescriptor} descriptor Asset load metadata for Sound
     */
    addSound(sound:PIXI.sound.Sound, descriptor:SoundDescriptor){
        const context = this[descriptor.context || 'sfx'];
        this.soundMeta[descriptor.id] = context;
        context.addSound(sound, descriptor.id, descriptor.volume);
    }

    /**
     * Play sound by ID
     * @param {string} soundID ID of Sound to play
     * @param {PIXI.sound.CompleteCallback} [onComplete] Called when Sound is finished playing
     * @returns {PIXI.sound.IMediaInstance | Promise<PIXI.sound.IMediaInstance>} instace of playing sound (or promise of to-be-played sound if not preloaded)
     */
    play(soundID:string, onComplete?:PIXI.sound.CompleteCallback){
        return this.soundMeta[soundID].sounds[soundID].play(onComplete);
    }

    /** Retrieve reference to Sound instance by ID
     * @param {string} soundID ID of sound to retrieve
     * @returns {PIXI.sound.Sound} Sound instance
     */
    getSound(soundID:string):PIXI.sound.Sound{
        return this.soundMeta[soundID].sounds[soundID];
    }

    /**
     * Pause specified Sound by ID - if no ID provided, pause all sounds
     * @param {string} [soundID] ID of sound to pause - if undefined, pause all sounds
     */
    pause(soundID?:string){
        if(!soundID){
            PIXI.sound.pauseAll();
        }
        else{
            this.soundMeta[soundID].sounds[soundID].resume();
        }
    }

    /**
     * Resume specified Sound by ID - if no ID provided, resume all sounds
     * @param {string} [soundID] ID of sound to resume - if undefined, resume all sounds
     */
    resume(soundID?:string){
        if(!soundID){
            PIXI.sound.resumeAll();
        }
        else{
            this.soundMeta[soundID].sounds[soundID].resume();
        }
    }

    /**
     * Adjust volume of a specific sound by ID
     * @param {string} id ID of sound to set volume on
     * @param {number} volume Number 0-1 to set volume of specified sound
     */
    setVolume(id:string, volume:number){
        this.soundMeta[id].applyVolume(id, volume);
    }

    /**
     * Destroy sound, remove from context and PIXI Sound cache
     * @param id ID of sound to remove
     */
    removeSound(id:string){
        const context = this.soundMeta[id];
        context.removeSound(id);
        delete this.soundMeta[id];
    }

}