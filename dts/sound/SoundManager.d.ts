/// <reference types="pixi-sound" />
import { SoundDescriptor } from "../assets/AssetManager";
import SoundContext from "./SoundContext";
export default class SoundManager {
    sfx: SoundContext;
    vo: SoundContext;
    music: SoundContext;
    private soundMeta;
    volume: number;
    sfxVolume: number;
    voVolume: number;
    musicVolume: number;
    addSound(sound: PIXI.sound.Sound, descriptor: SoundDescriptor): void;
    play(soundID: string, onComplete?: PIXI.sound.CompleteCallback): PIXI.sound.IMediaInstance | Promise<PIXI.sound.IMediaInstance>;
    getSound(soundID: string): PIXI.sound.Sound;
    pause(soundID?: string): void;
    resume(soundID?: string): void;
    setVolume(id: string, volume: number): void;
    removeSound(id: string): void;
}
