import { SoundContext } from "..";
/**
 * Manages Caption playback
 */
export default class Captions {
    private _config;
    private _currentCaption;
    private _currentAudio;
    private _currentDuration;
    private _positionInCaption;
    private _combined;
    private _audioFiles;
    private _audioIndex;
    private _captionShown;
    voContext: SoundContext;
    captionString: SpringRoll.Property<string>;
    constructor(config: CaptionConfig, vo: SoundContext);
    getCaption(audiofile: string): Array<CaptionInfo>;
    makeCombinedCaption(audiofiles: Array<string>): Array<CaptionInfo>;
    getTotalDuration(audiofile: string): number;
    getCombinedDuration(audiofiles: Array<string>): number;
    captionAtTime(timeInMS: number, caption?: Array<CaptionInfo>): string;
    captionSingle(audiofile: string): void;
    captionCombined(audiofiles: Array<string>): void;
    update(delta: number): void;
}
export type CaptionConfig = {
    [audiofile: string]: Array<CaptionInfo>;
};
export type CaptionInfo = {
    content: string;
    start: number;
    end: number;
};
