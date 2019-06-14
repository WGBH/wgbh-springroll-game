export default class SoundContext {

    /** Map of Sounds by ID */
    public sounds: {[key:string]: PIXI.sound.Sound} = {};
    /** Map of individual Sound volumes by ID */
    private volumes: {[key:string]: number} = {};

    private _globalVolume:number = 1;
    private _volume:number = 1;

    public currentSound:string;
    public single:boolean = false;
    private singleCallback:PIXI.sound.CompleteCallback;

    constructor(issingle?:boolean) {
        this.single = (issingle === true);
        this.currentSound = null;
    }

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
     * 
     * @param {string} id 
     * @param {CompleteCallback} onComplete 
     */
    play(id:string, onComplete?:PIXI.sound.CompleteCallback) {
        if (this.single){
            if(this.currentSound) {
                // stop currently playing sound
                this.stop(this.currentSound);
            }
            this.singleCallback = onComplete;
        }
        this.currentSound = id;
        return this.sounds[id].play(this.single ? this.singlePlayComplete : onComplete);
    }

    private singlePlayComplete = (sound:PIXI.sound.Sound)=>{
        this.currentSound = null;
        if(this.singleCallback){
            const call = this.singleCallback;
            this.singleCallback = null;
            call(sound);
        }
    }

    stop(id:string) {
        if (id === this.currentSound) {
            this.currentSound = null;
            this.singleCallback = null;
        }
        if(this.sounds[id]){
            this.sounds[id].stop();
        }
    }

    stopAll() {
        this.currentSound = null;
        for (let key in this.sounds) {
            this.sounds[key].stop();
        }
    }

    /**
     * 
     * @param soundid ID of sound to get position of - if none, then find position of most recently played sound
     */
    getPosition(soundid?:string):number {
        if (!soundid) { 
            soundid = this.currentSound;
        }
        if(!this.sounds[soundid] || !this.sounds[soundid].isPlaying) {return -1;}
        return this.sounds[soundid].instances[0].progress; // NOTE: There seems to be a Safari bug where the progress listener can become detached from a sound...may need a fallback or workaround
    }

    getPositionSeconds(soundid?:string):number {
        if (!soundid) { 
            soundid = this.currentSound;
        }
        if(!this.sounds[soundid] || !this.sounds[soundid].isPlaying) {return -1;}
        return this.sounds[soundid].instances[0].progress * this.sounds[soundid].duration; // NOTE: There seems to be a Safari bug where the progress listener can become detached from a sound...may need a fallback or workaround
   
    }

    isPlaying():boolean {
        for (let key in this.sounds) {
            if (this.sounds[key].isPlaying) {
                return true;
            }
        }
        return false;
    }


    /**
     * Destroy sound, remove from context and PIXI Sound cache
     * @param id ID of sound to remove
     */
    removeSound(id:string){
        PIXI.sound.remove(id);
        delete this.sounds[id];
        delete this.volumes[id];
        if(id === this.currentSound){
            this.currentSound = null;
        }
    }

}