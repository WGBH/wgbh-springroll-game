import { AnimateAsset, load, MovieClip } from '@pixi/animate';
import * as animate from '@pixi/animate';
import { Loader, ILoaderResource, Spritesheet, Texture, utils } from 'pixi.js';
import SoundManager from "../sound/SoundManager";
import { Options, sound } from '@pixi/sound';

/**
 * Manages loading, caching, and unloading of assets
 */
export default class AssetManager {
    
    /** object containing references to cached instances of loaded assets */
    public cache:AssetCache = {data:{}, images:{}, animations:{}, animateAssets:{}, spritesheets:{}};

    /** IDs of cached assets that should persist between scenes */
    private globalCache:{shapes:string[], textures:string[], sounds:string[], data:string[], animations:string[], spritesheets:string[]} = {
        shapes: [],
        textures: [],
        sounds: [],
        data: [],
        animations: [],
        spritesheets:[]
    };

    /** IDs of loaded Sounds */
    private soundIDs: string[] = [];
    private soundManager:SoundManager;

    private sceneActive = false;


    constructor(soundManager:SoundManager){
        this.soundManager = soundManager;
    }
 
    /**
     * loads assets for a Scene
     * @param {AssetList} assetList assets to be loaded
     * @param {Function} callback called when all assets in assetList have been loaded
     */
    public loadAssets(assetList:AssetList, callback:Function){
        if(!assetList || !assetList.length){
            return callback();
        }

        let manifests:ManifestDescriptor[] = [];
        for(let asset of assetList){
            if(asset.type === 'manifest'){
                manifests.push(asset);
            }
        }
        if(manifests.length){
            const loads:Promise<any>[] = [];
            for(let i = 0; i < manifests.length; i++){
                loads.push(this.loadManifest(manifests[i]));
            }

            Promise.all(loads).then((results:AssetList[])=>{
                //Merge manifests with asset list
                let newList = assetList.slice();
                for(let i = newList.length - 1; i >= 0; i--){
                    if(newList[i].type === 'manifest'){
                        newList.splice(i, 1);
                    }
                }
                for(let result of results){
                    newList = newList.concat(result);
                }
                this.loadAssets(newList, callback);
            });
            return;
        }

        const localList: AssetList = [];
        const globalList: AssetList = [];
        for(let asset of assetList){
            if((asset.type === 'animate' && this.globalCache.animations.includes(asset.id)) ||
                (asset.type === 'data' && this.globalCache.data.includes(asset.id)) ||
                (asset.type === 'sound' && this.globalCache.sounds.includes(asset.id)) ||
                (asset.type === 'image' && this.globalCache.textures.includes(asset.id))
            ){
                console.info('Using global asset: ', asset.id);
                continue;
            }
            asset.isGlobal ? globalList.push(asset) : localList.push(asset);
        }
        if(this.sceneActive && globalList.length){
            console.error('Mid-Scene loading of global assets is unsupported - move these to preload() or disable global caching of all mid-Scene assets');
        }
        this.sceneActive = true;
        Promise.resolve()
            .then(() => this.executeLoads(globalList))
            .then(() => this.saveCacheState())
            .then(() => this.executeLoads(localList))
            .then(() => {callback();});
    }

    /** custom handling for loading different types of assets */
    private executeLoads(assetList:AssetList):Promise<any>{
        return new Promise((resolve)=>{
            const loads:Promise<any>[] = [];
            const imageAssets: ImageDescriptor[] = [];
            for(let asset of assetList){
                switch(asset.type){
                    case 'animate':
                        loads.push(this.loadAnimate(asset));
                        break;
                    case 'data':
                        loads.push(this.loadData(asset));
                        break;
                    case 'spritesheet':
                        loads.push(this.loadSpritesheet(asset));
                        break;
                    case 'sound':
                        loads.push(this.loadSound(asset));
                        break;
                    case 'image':
                    imageAssets.push(asset);
                        break;
                }
            }
            if(imageAssets.length){
                loads.push(this.loadImages(imageAssets));
            }
            Promise.all(loads).then(resolve);
        });
    }

    /** Save current state of PIXI Global caches, to prevent unloading global assets */
    private saveCacheState = () => {
        Object.keys(utils.TextureCache).forEach((key) => {
            if(!this.globalCache.textures.includes(key)){
                this.globalCache.textures.push(key);
            }
        });
    }

    /**
     * unload assets loaded via loadAssets
     * @param {boolean} [includeGlobal = false]  should global caches be cleared?
     */
    public unloadAssets(includeGlobal = false){
        if(includeGlobal){
            this.globalCache.animations.length = 0;
            this.globalCache.data.length = 0;
            this.globalCache.sounds.length = 0;
            this.globalCache.shapes.length = 0;
            this.globalCache.textures.length = 0;
            this.globalCache.spritesheets.length = 0;
        }

        for(let id in this.cache.animations){
            if(!this.globalCache.animations.includes(id)){
                if(this.cache.animations[id]){
                    this.cache.animations[id].destroy();
                    delete this.cache.animations[id];
                }
            }
        }
        for(let id in this.cache.animateAssets){
            if(!this.globalCache.animations.includes(id)){
                for(let key in this.cache.animateAssets[id].shapes){
                    delete this.cache.animateAssets[id].shapes[key];
                }
                for(let key in this.cache.animateAssets[id].textures){
                    this.cache.animateAssets[id].textures[key].destroy(true);
                    delete this.cache.animateAssets[id].textures[key];
                }
                for(let spritesheet of this.cache.animateAssets[id].spritesheets){
                    spritesheet.destroy(true);
                }
                this.cache.animateAssets[id].spritesheets.length = 0;
                delete this.cache.animateAssets[id];
            }
        }
        for(let id in this.cache.spritesheets){
            if(!this.globalCache.spritesheets.includes(id)){
                for(let key of Object.keys(this.cache.spritesheets[id].textures)){
                    this.cache.spritesheets[id].textures[key].destroy(true);
                }
                for(let key of Object.keys(this.cache.spritesheets[id].animations)){
                    for(let texture of this.cache.spritesheets[id].animations[key]){
                        texture.destroy(true);
                    }
                }
                this.cache.spritesheets[id].destroy(true);
                delete this.cache.spritesheets[id];
            }
        }
        for(let id in utils.TextureCache){
            if(!this.globalCache.textures.includes(id)){
                utils.TextureCache[id].destroy(true);
                delete this.cache.images[id];
            }
        }
        for(let i = this.soundIDs.length - 1; i >= 0; i--){
            let id = this.soundIDs[i];
            if(!this.globalCache.sounds.includes(id)){
                this.soundManager.removeSound(id);
                this.soundIDs.splice(i, 1);
            }
        }
        for(let id in Loader.shared.resources){
            console.warn('unmanaged resource detected: ', id, Loader.shared.resources[id]);
        }
        this.sceneActive = false;
    }
    
    /**
     * load assets for a PixiAnimate stage
     * @param {AnimateAssetDescriptor} animateAssetDescriptor 
     */
    private loadAnimate(animateAssetDescriptor:AnimateAssetDescriptor):Promise<any>{
        return new Promise<void>((resolve) => {
            animateAssetDescriptor.asset.setup(animate);
            load(
                animateAssetDescriptor.asset,
                {
                    createInstance:!!animateAssetDescriptor.cacheInstance,
                    complete: (movieClip?)=>{
                        if(animateAssetDescriptor.cacheInstance){
                            this.cache.animations[animateAssetDescriptor.id] = movieClip;
                        }
                        if(animateAssetDescriptor.isGlobal){
                            this.globalCache.animations.push(animateAssetDescriptor.id);
                        }
                        this.cache.animateAssets[animateAssetDescriptor.id] = animateAssetDescriptor.asset;
                        resolve();
                    }
                }
            );
        });
    }

    /**
     * Load list of individual image files to PIXI Textures
     * @param {ImageDescriptor[]} assets Array of imnages assets to load
     */
    private loadImages(assets:ImageDescriptor[]):Promise<any>{
        let imageLoader = new Loader();
        return new Promise<void>((resolve)=>{
            for(let asset of assets){
                imageLoader.add(asset.id, asset.path);
            }
            imageLoader.load((loader:Loader, resources:{[key:string]: ILoaderResource })=>{
                for(let key of Object.keys(resources)){
                    this.cache.images[key] = resources[key].texture;
                }
                imageLoader.destroy();
                resolve();
            });
        });
    }

    /**
     * Load an audio file to PIXI Sound
     * @param {SoundDescriptor} soundDescriptor 
     */
    private loadSound(soundDescriptor:SoundDescriptor):Promise<void>{
        return new Promise((resolve)=>{
            let soundOptions:Options = {url: soundDescriptor.path, preload:soundDescriptor.preload !== false};
            if(soundDescriptor.volume !== undefined && typeof soundDescriptor.volume === 'number'){
                soundOptions.volume = soundDescriptor.volume;
            }
            if(soundOptions.preload){
                soundOptions.loaded = ()=>{ resolve(); };
            }

            this.soundManager.addSound(sound.add(soundDescriptor.id, soundOptions), soundDescriptor);
            this.soundIDs.push(soundDescriptor.id);
            if(soundDescriptor.isGlobal){
                this.globalCache.sounds.push(soundDescriptor.id);
            }
            if(!soundOptions.preload){
                resolve();
            }
        });
    }

    /**
     * Load JSON data
     * @param {DataDescriptor} dataDescriptor 
     */
    private loadData(dataDescriptor:DataDescriptor):Promise<void>{
        const dataLoader = new Loader();
        return new Promise((resolve)=>{
            dataLoader.add(dataDescriptor.id, dataDescriptor.path);
            dataLoader.load((loader:Loader, resources:{[key:string]: ILoaderResource })=>{
                this.cache.data[dataDescriptor.id] = resources[dataDescriptor.id].data;
                if(dataDescriptor.isGlobal){
                    this.globalCache.data.push(dataDescriptor.id);
                }
                dataLoader.destroy();
                resolve();
            });
        });
    }

    /**
     * Load Spritesheet data
     * @param {SpritesheetDescriptor} descriptor 
     */
    private loadSpritesheet(descriptor:SpritesheetDescriptor):Promise<void>{
        const dataLoader = new Loader();
        return new Promise((resolve)=>{
            dataLoader.add(descriptor.id, descriptor.path);
            dataLoader.load((loader:Loader, resources:{[key:string]: ILoaderResource })=>{
                this.cache.spritesheets[descriptor.id] = resources[descriptor.id].spritesheet;
                if(descriptor.isGlobal){
                    this.globalCache.spritesheets.push(descriptor.id);
                }
                dataLoader.destroy();
                resolve();
            });
        });
    }

    /**
     * Load JSON file containing an AssetList
     * @param {ManifestDescriptor} manifestDescriptor 
     */
    private loadManifest(manifestDescriptor:ManifestDescriptor):Promise<AssetDescriptor[]>{
        const dataLoader = new Loader();
        return new Promise((resolve)=>{
            dataLoader.add(manifestDescriptor.path);
            dataLoader.load((loader:Loader, resources:{[key:string]: ILoaderResource })=>{
                const data:AssetDescriptor[] = resources[manifestDescriptor.path].data;
                dataLoader.destroy();
                if(manifestDescriptor.isGlobal){
                    for(let entry of data){
                        entry.isGlobal = true;
                    }
                }
                resolve(data);
                
            });
        });
    }
}

/** Array of  */
export type AssetList = (ManifestDescriptor|AnimateAssetDescriptor|DataDescriptor|ImageDescriptor|SoundDescriptor|SpritesheetDescriptor)[];

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
    preload?:boolean;
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
    cacheInstance?:boolean;
}

export interface AssetCache {
    /** references to data objects from loaded JSON files */
    data: { [key: string]: any };
    /** references to Textures for loaded Images */
    images: { [key: string]: Texture };
    /** instances of loaded PixiAnimate stages - use these first when possible */
    animations: { [key: string]: MovieClip };
    /** published Animate asset data, includes stage constructor, metadata, and loaded resources */
    animateAssets: { [key: string]: AnimateAsset };
    spritesheets:{ [key: string]: Spritesheet };
}