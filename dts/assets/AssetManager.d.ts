import { AnimateAsset, MovieClip } from 'pixi-animate';
import { Spritesheet, Texture } from 'pixi.js';
import SoundManager from "../sound/SoundManager";
/**
 * Manages loading, caching, and unloading of assets
 */
export default class AssetManager {
    /** object containing references to cached instances of loaded assets */
    cache: AssetCache;
    /** IDs of cached assets that should persist between scenes */
    private globalCache;
    /** IDs of loaded Sounds */
    private soundIDs;
    private soundManager;
    private sceneActive;
    constructor(soundManager: SoundManager);
    /**
     * loads assets for a Scene
     * @param {AssetList} assetList assets to be loaded
     * @param {Function} callback called when all assets in assetList have been loaded
     */
    loadAssets(assetList: AssetList, callback: Function): any;
    /** custom handling for loading different types of assets */
    private executeLoads;
    /** Save current state of PIXI Global caches, to prevent unloading global assets */
    private saveCacheState;
    /**
     * unload assets loaded via loadAssets
     * @param {boolean} [includeGlobal = false]  should global caches be cleared?
     */
    unloadAssets(includeGlobal?: boolean): void;
    /**
     * load assets for a PixiAnimate stage
     * @param {AnimateAssetDescriptor} animateAssetDescriptor
     */
    private loadAnimate;
    /**
     * Load list of individual image files to PIXI Textures
     * @param {ImageDescriptor[]} assets Array of imnages assets to load
     */
    private loadImages;
    /**
     * Load an audio file to PIXI Sound
     * @param {SoundDescriptor} soundDescriptor
     */
    private loadSound;
    /**
     * Load JSON data
     * @param {DataDescriptor} dataDescriptor
     */
    private loadData;
    /**
     * Load Spritesheet data
     * @param {SpritesheetDescriptor} descriptor
     */
    private loadSpritesheet;
    /**
     * Load JSON file containing an AssetList
     * @param {ManifestDescriptor} manifestDescriptor
     */
    private loadManifest;
}
/** Array of  */
export declare type AssetList = (ManifestDescriptor | AnimateAssetDescriptor | DataDescriptor | ImageDescriptor | SoundDescriptor | SpritesheetDescriptor)[];
/** Load instruction base interface */
export interface AssetDescriptor {
    /** Should asset stay in cache after current Scene is exited? */
    isGlobal?: boolean;
}
/** Load instructions for JSON file containing an AssetList - Manifests cannot include 'animate' type assets */
export interface ManifestDescriptor extends AssetDescriptor {
    /** path to JSON format AssetList */
    path: string;
    type: 'manifest';
}
/** Load instructions for Sound assets */
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
/** Load instructions for individual image assets */
export interface ImageDescriptor extends AssetDescriptor {
    /** identifier of image for later retrieval from cache */
    id: string;
    /** path to image file */
    path: string;
    type: 'image';
}
/** Load instructions for JSON data assets */
export interface DataDescriptor extends AssetDescriptor {
    /** identifier of data object for later retrieval from cache */
    id: string;
    /** path to JSON file */
    path: string;
    type: 'data';
}
/** Load instructions for spritesheet assets */
export interface SpritesheetDescriptor extends AssetDescriptor {
    /** identifier of spritesheet for later retrieval from cache */
    id: string;
    /** path to JSON spritesheet atlas file */
    path: string;
    type: 'spritesheet';
}
/** Load instructions for PixiAnimate stage dependency assets */
export interface AnimateAssetDescriptor extends AssetDescriptor {
    /** identifier of Animate stage for later retrieval from cache */
    id: string;
    /** full imported PixiAnimate publish – call asset.setup(animate) before loading */
    asset: AnimateAsset;
    type: 'animate';
    /** should an instance of this Stage be saved on assets.animations? */
    cacheInstance?: boolean;
}
export interface AssetCache {
    /** references to data objects from loaded JSON files */
    data: {
        [key: string]: any;
    };
    /** references to Textures for loaded Images */
    images: {
        [key: string]: Texture;
    };
    /** instances of loaded PixiAnimate stages - use these first when possible */
    animations: {
        [key: string]: MovieClip;
    };
    /** published Animate asset data, includes stage constructor, metadata, and loaded resources */
    animateAssets: {
        [key: string]: AnimateAsset;
    };
    spritesheets: {
        [key: string]: Spritesheet;
    };
}
