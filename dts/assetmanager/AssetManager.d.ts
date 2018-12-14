/// <reference types="pixi.js" />
/// <reference types="pixi-sound" />
/// <reference types="pixi-animate" />
export default class AssetManager {
    data: {
        [key: string]: any;
    };
    images: {
        [key: string]: PIXI.Texture;
    };
    sounds: {
        [key: string]: PIXI.sound.Sound;
    };
    /** IDs of cached assets that should persist between scenes */
    private globalCache;
    /**
     * loads assets for a Scene
     * @param assetList assets to be loaded
     */
    loadAssets(assetList: AssetList, callback: Function): void;
    private executeLoads;
    private saveCacheState;
    /**
     * unload assets loaded via loadAssets
     * @param {boolean} includeGlobal  should global caches be cleared?
     */
    unloadAssets(includeGlobal?: boolean): void;
    private loadAnimate;
    private loadPixi;
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
    /** `stage` property from PixiAnimate export */
    stage: AnimateStage;
    type: 'animate';
}
/** Stage of PixiAnimate export, includes asset dependency manifest */
export declare type AnimateStage = typeof PIXI.animate.MovieClip & {
    assets: {
        [key: string]: string;
    };
};
