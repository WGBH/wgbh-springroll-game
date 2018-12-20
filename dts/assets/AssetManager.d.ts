/// <reference types="pixi.js" />
/// <reference types="pixi-animate" />
import SoundManager from "../sound/SoundManager";
export default class AssetManager {
    /** references to data objects from loaded JSON files */
    data: {
        [key: string]: any;
    };
    /** references to Textures for loaded Images */
    images: {
        [key: string]: PIXI.Texture;
    };
    /** instances of loaded PixiAnimate stages - use these first when possible */
    animations: {
        [key: string]: PIXI.animate.MovieClip;
    };
    /** IDs of cached assets that should persist between scenes */
    private globalCache;
    /** IDs of loaded Sounds */
    private soundIDs;
    private soundManager;
    constructor(soundManager: SoundManager);
    /**
     * loads assets for a Scene
     * @param assetList assets to be loaded
     */
    loadAssets(assetList: AssetList, callback: Function): any;
    private executeLoads;
    private saveCacheState;
    /**
     * unload assets loaded via loadAssets
     * @param {boolean} includeGlobal  should global caches be cleared?
     */
    unloadAssets(includeGlobal?: boolean): void;
    private loadAnimate;
    private loadImages;
    private loadSound;
    private loadData;
    private loadManifest;
}
export declare type AssetList = (ManifestDescriptor | AnimateStageDescriptor | DataDescriptor | ImageDescriptor | SoundDescriptor)[];
export interface AssetDescriptor {
    /** Should asset stay in cache after current Scene is exited? */
    isGlobal?: boolean;
}
export interface ManifestDescriptor extends AssetDescriptor {
    /** path to JSON format AssetList */
    path: string;
    type: 'manifest';
}
export interface SoundDescriptor extends AssetDescriptor {
    /** identifier of sound for later retrieval from cache */
    id: string;
    /** path to audio file. Supports automatic format selection via './path/to/file.{ogg,mp3}' */
    path: string;
    type: 'sound';
    /** volume to initialize this sound to */
    volume?: number;
    /** true to disallow playing multiple layered instances at once. */
    singleInstance?: boolean;
    /** set `false` to not preload this sound - defaults to `true` */
    preload?: boolean;
    /** category of sound for group volume control - defaults to "sfx" */
    context?: 'vo' | 'sfx' | 'music';
}
export interface ImageDescriptor extends AssetDescriptor {
    /** identifier of image for later retrieval from cache */
    id: string;
    /** path to image file */
    path: string;
    type: 'image';
}
export interface DataDescriptor extends AssetDescriptor {
    /** identifier of data object for later retrieval from cache */
    id: string;
    /** path to JSON file */
    path: string;
    type: 'data';
}
export interface AnimateStageDescriptor extends AssetDescriptor {
    /** identifier of Animate stage for later retrieval from cache */
    id: string;
    /** `stage` property from PixiAnimate export */
    stage: AnimateStage;
    type: 'animate';
    /** should an instance of this Stage be saved on assets.animations? */
    cacheInstance?: boolean;
}
/** Stage of PixiAnimate export, includes asset dependency manifest */
export declare type AnimateStage = typeof PIXI.animate.MovieClip & {
    assets: {
        [key: string]: string;
    };
};
