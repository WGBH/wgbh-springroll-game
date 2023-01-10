import { CompleteCallback, IMediaInstance, Sound } from '@pixi/sound';
export default class SoundContext {
    /** Map of Sounds by ID */
    sounds: {
        [key: string]: Sound;
    };
    /** Map of individual Sound volumes by ID */
    private volumes;
    private _globalVolume;
    private _volume;
    currentSound: string;
    single: boolean;
    private singleCallback;
    constructor(issingle?: boolean);
    /** Context-specific volume */
    set volume(volume: number);
    /** Volume applied to all contexts */
    set globalVolume(volume: number);
    /**
     *
     * @param {pixiSound.Sound} soundInstance Sound instance to add
     * @param {string} id ID of sound to add
     * @param {number} volume Number 0-1 of volume for this sound
     */
    addSound(soundInstance: Sound, id: string, volume?: number): void;
    /**
     * Adjust volume of a specific sound by ID
     * @param {string} id ID of sound to set volume on
     * @param {number} volume Number 0-1 to set volume of specified sound
     */
    applyVolume(id: string, volume?: number): void;
    /**
     *
     * @param {string} id
     * @param {CompleteCallback} onComplete
     */
    play(id: string, onComplete?: CompleteCallback): IMediaInstance | Promise<IMediaInstance>;
    private singlePlayComplete;
    stop(id: string): void;
    stopAll(): void;
    /**
     *
     * @param soundid ID of sound to get position of - if none, then find position of most recently played sound
     */
    getPosition(soundid?: string): number;
    getPositionSeconds(soundid?: string): number;
    isPlaying(): boolean;
    /**
     * Destroy sound, remove from context and PIXI Sound cache
     * @param id ID of sound to remove
     */
    removeSound(id: string): void;
}
