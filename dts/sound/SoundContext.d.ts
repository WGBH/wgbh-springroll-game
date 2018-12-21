/// <reference types="pixi-sound" />
export default class SoundContext {
    /** Map of Sounds by ID */
    sounds: {
        [key: string]: PIXI.sound.Sound;
    };
    /** Map of individual Sound volumes by ID */
    private volumes;
    private _globalVolume;
    private _volume;
    /** Context-specific volume */
    volume: number;
    /** Volume applied to all contexts */
    globalVolume: number;
    /**
     *
     * @param {PIXI.sound.Sound} sound Sound instance to add
     * @param {string} id ID of sound to add
     * @param {number} volume Number 0-1 of volume for this sound
     */
    addSound(sound: PIXI.sound.Sound, id: string, volume?: number): void;
    /**
     * Adjust volume of a specific sound by ID
     * @param {string} id ID of sound to set volume on
     * @param {number} volume Number 0-1 to set volume of specified sound
     */
    applyVolume(id: string, volume?: number): void;
    /**
     * Destroy sound, remove from context and PIXI Sound cache
     * @param id ID of sound to remove
     */
    removeSound(id: string): void;
}
