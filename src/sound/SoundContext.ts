export default class SoundContext {

    /** Map of Sounds by ID */
    public sounds: {[key:string]: PIXI.sound.Sound} = {};
    /** Map of individual Sound volumes by ID */
    private volumes: {[key:string]: number} = {};

    private _globalVolume:number = 1;
    private _volume:number = 1;

    /** Context-specific volume */
    set volume(volume:number){
        this._volume = volume;
        for(let key in this.sounds){
            this.applyVolume(key);
        }
    }

    /** Volume applied to all contexts */
    set globalVolume(volume:number){
        this._globalVolume = volume;
        for(let key in this.sounds){
            this.applyVolume(key);
        }
    }

    /**
     * 
     * @param {PIXI.sound.Sound} sound Sound instance to add
     * @param {string} id ID of sound to add
     * @param {number} volume Number 0-1 of volume for this sound
     */
    addSound(sound:PIXI.sound.Sound, id:string, volume:number = 1){
        if(this.sounds[id]){
            console.error('Sound already added with id: ', id);
        }
        this.sounds[id] = sound;
        this.volumes[id] = volume;
        this.applyVolume(id);
    }

    /**
     * Adjust volume of a specific sound by ID
     * @param {string} id ID of sound to set volume on
     * @param {number} volume Number 0-1 to set volume of specified sound
     */
    applyVolume(id:string, volume?:number){
        if(volume !== undefined){
            this.volumes[id] = volume;
        }
        this.sounds[id].volume = this.volumes[id] * this._globalVolume * this._volume;
    }

    /**
     * Destroy sound, remove from context and PIXI Sound cache
     * @param id ID of sound to remove
     */
    removeSound(id:string){
        PIXI.sound.remove(id);
        delete this.sounds[id];
        delete this.volumes[id];
    }

}