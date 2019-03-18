import { SoundContext } from "..";
import { Property } from "springroll";


/**
 * Manages Caption playback
 */
export default class Captions {

    private _config:CaptionConfig;
    private _currentCaption:Array<CaptionInfo>;
    private _currentAudio:string;
    private _currentDuration:number;
    private _positionInCaption:number;

    private _combined:boolean = false;
    private _audioFiles:Array<string>;
    private _audioIndex:number;
    private _captionShown:boolean;

    public voContext:SoundContext;
    
    public captionString:SpringRoll.Property<string>;

    constructor(config:CaptionConfig,vo:SoundContext) {
        this._config = config;
        this.voContext = vo;
        this.captionString = new Property("");
    }

    getCaption(audiofile:string):Array<CaptionInfo> {
        const capt = this._config[audiofile];
        return capt;
    }

    makeCombinedCaption(audiofiles:Array<string>):Array<CaptionInfo> {
        const caption = [{
            "content":"",
            "start":0,
            "end":0
        }];

        for (let i = 0; i < audiofiles.length; i++) {
            let capt = this.getCaption(audiofiles[i]);
            for (let j = 0; j < capt.length; j++) {
                capt[0].content += capt[j].content + " ";
            }
            capt[0].end += this.getTotalDuration(audiofiles[i]);
        }
        return caption;
    }

    getTotalDuration(audiofile:string):number {
        let total = 0;
        const capt = this.getCaption(audiofile);
        total = capt[capt.length - 1].end;
        return total;
    }

    getCombinedDuration(audiofiles:Array<string>):number {
        let total = 0;
        for(let i = 0; i < audiofiles.length; i++) {
            total += this.getTotalDuration(audiofiles[i]);
        }
        return total;
    }

    captionAtTime(timeInMS:number, caption?:Array<CaptionInfo>) {
        if (caption) {
            this._currentCaption = caption;
        }
        for(var i = this._currentCaption.length - 1; i >= 0; i--) {
          if(this._currentCaption[i].end > timeInMS && this._currentCaption[i].start < timeInMS) {
            return this._currentCaption[i].content;
          }
        }
        return "";
    }

    captionSingle(audiofile:string) {
        this._audioFiles = [];
        this._audioIndex = 0;
        this._combined = false;

        this._currentAudio = audiofile;
        this._currentCaption = this.getCaption(this._currentAudio);
        this._currentDuration = this.getTotalDuration(this._currentAudio);
    }

    captionCombined(audiofiles:Array<string>) {
        this._audioFiles = audiofiles;
        this._audioIndex = 0;
        this._combined = true;

        this._currentAudio = audiofiles[this._audioIndex];
        this._currentCaption = this.makeCombinedCaption(this._audioFiles);
        this._currentDuration = this.getCombinedDuration(this._audioFiles);
    }

    update(delta:number) {
        if (!this.voContext.isPlaying()) {
            if(this._captionShown) {
                this._captionShown = false;
                // trigger a hide caption
                this.captionString.value = "";
            }
            return;
        }

        let thiscaption, position;
        if (this._combined) {
            // as long as voContext is playing within the confines of the set of audio files, don't change the caption
            this._positionInCaption+=delta;
            position = this.voContext.getPosition(this._currentAudio);
            thiscaption = this.captionAtTime(position * this._currentDuration);

        } else {
            // change the caption if it's warranted
            position = this.voContext.getPosition(this._currentAudio);
            this._positionInCaption = position * this._currentDuration;
        }

        if(!position) {
            // hide the caption
            if(!this._combined && this._captionShown) {
              this._captionShown = false;
              // trigger a hide caption
              this.captionString.value = "";
            }
            return;
          }

          if(this._currentAudio != this.voContext.currentSound && !this._combined) {
            // get new caption based on currently-playing audio
            this.captionSingle(this.voContext.currentSound);
          }

          thiscaption = this.captionAtTime(this._positionInCaption);

          if(this.captionString.value != thiscaption) {
            this.captionString.value = thiscaption;
            this._captionShown = thiscaption != "";
          }
      }

};

export type CaptionConfig = {
    [audiofile:string]:Array<CaptionInfo>
};

export type CaptionInfo = {
    content:string,
    start:number,
    end:number
};