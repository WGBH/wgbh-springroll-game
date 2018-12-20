/// <reference types="pixi-sound" />
export default class SoundContext {
    sounds: {
        [key: string]: PIXI.sound.Sound;
    };
    private volumes;
    private _globalVolume;
    private _volume;
    volume: number;
    globalVolume: number;
    addSound(sound: PIXI.sound.Sound, id: string, volume?: number): void;
    applyVolume(id: string, volume?: number): void;
    removeSound(id: string): void;
}
