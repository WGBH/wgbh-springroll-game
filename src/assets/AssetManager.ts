import SoundManager from "../sound/SoundManager";

/**
 * Manages loading, caching, and unloading of assets
 */
export default class AssetManager {
    
    /** object containing references to cached instances of loaded assets */
    public cache:AssetCache = {data:{}, images:{}, animations:{}};

    /** IDs of cached assets that should persist between scenes */
    private globalCache:{shapes:string[], textures:string[], sounds:string[], data:string[], animations:string[]} = {
        shapes: [],
        textures: [],
        sounds: [],
        data: [],
        animations: []
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
        Object.keys(PIXI.animate.ShapesCache).forEach((key) => this.globalCache.shapes.push(key));
        Object.keys(PIXI.utils.TextureCache).forEach((key) => this.globalCache.textures.push(key));
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
        }

        for(let id in this.cache.animations){
            if(!this.globalCache.animations.includes(id)){
                if(this.cache.animations[id]){
                    this.cache.animations[id].destroy();
                    delete this.cache.animations[id];
                }
            }
        }
        for(let id in PIXI.utils.TextureCache){
            if(!this.globalCache.textures.includes(id)){
                (PIXI.utils.TextureCache[id] as PIXI.Texture).destroy(true);
                delete this.cache.images[id];
            }
        }
        for(let id in PIXI.animate.ShapesCache){
            if(!this.globalCache.shapes.includes(id)){
                PIXI.animate.ShapesCache.remove(id);
            }
        }
        for(let i = this.soundIDs.length - 1; i >= 0; i--){
            let id = this.soundIDs[i];
            if(!this.globalCache.sounds.includes(id)){
                this.soundManager.removeSound(id);
                this.soundIDs.splice(i, 1);
            }
        }
        for(let id in PIXI.loader.resources){
            console.warn('unmanaged resource detected: ', id, PIXI.loader.resources[id]);
        }
        this.sceneActive = false;
    }
    
    /**
     * load assets for a PixiAnimate stage
     * @param {AnimateStageDescriptor} animateStageDescriptor 
     */
    private loadAnimate(animateStageDescriptor:AnimateStageDescriptor):Promise<any>{
        return new Promise((resolve) => {
            PIXI.animate.load(animateStageDescriptor.stage, (movieClip)=>{
                if(animateStageDescriptor.cacheInstance){
                    this.cache.animations[animateStageDescriptor.id] = movieClip;
                }
                if(animateStageDescriptor.isGlobal){
                    this.globalCache.animations.push(animateStageDescriptor.id);
                }
                resolve();
            });
        });
    }

    /**
     * Load list of individual image files to PIXI Textures
     * @param {ImageDescriptor[]} assets Array of imnages assets to load
     */
    private loadImages(assets:ImageDescriptor[]):Promise<any>{
        let imageLoader = new PIXI.loaders.Loader();
        return new Promise((resolve)=>{
            for(let asset of assets){
                imageLoader.add(asset.id, asset.path);
            }
            imageLoader.load((loader:PIXI.loaders.Loader, resources:PIXI.loaders.ResourceDictionary)=>{
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
            let soundOptions:PIXI.sound.Options = {url: soundDescriptor.path, preload:soundDescriptor.preload !== false};
            if(soundDescriptor.volume !== undefined && typeof soundDescriptor.volume === 'number'){
                soundOptions.volume = soundDescriptor.volume;
            }
            if(soundOptions.preload){
                soundOptions.loaded = ()=>{ resolve(); };
            }

            this.soundManager.addSound(PIXI.sound.add(soundDescriptor.id, soundOptions), soundDescriptor);
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
        if(!document.getElementById('debugDiv')){
            let div = document.createElement('div');
            div.id = 'debugDiv';
            div.style.position = 'fixed';
            div.style.top = '0';
            div.style.color = 'yellow';
            div.style.width = '100%';
            document.getElementsByTagName('body')[0].appendChild(div);
        }
        document.getElementById('debugDiv').append(`ATTEMPTING TO LOAD DATA! `);

        const dataLoader = new PIXI.loaders.Loader();
        return new Promise((resolve)=>{
            dataLoader.add(dataDescriptor.id, dataDescriptor.path);
            dataLoader.load((loader:PIXI.loaders.Loader, resources:PIXI.loaders.ResourceDictionary)=>{
                for(let key of Object.keys(resources)){
                    this.cache.images[key] = resources[key].texture;
                }
                document.getElementById('debugDiv').append(`LOADED!`);
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
     * Load JSON file containing an AssetList
     * @param {ManifestDescriptor} manifestDescriptor 
     */
    private loadManifest(manifestDescriptor:ManifestDescriptor):Promise<AssetDescriptor[]>{
        return new Promise((resolve)=>{
            const request = new XMLHttpRequest();
            request.open('GET', manifestDescriptor.path);
            request.onreadystatechange = ()=>{
                if ((request.status === 200) && (request.readyState === 4))
                {
                    let data = JSON.parse(request.responseText);
                    if(manifestDescriptor.isGlobal){
                        for(let entry of data){
                            entry.isGlobal = true;
                        }
                    }
                    resolve(data);
                }
            };
            request.send();
        });
    }
}

/** Array of  */
export type AssetList = (ManifestDescriptor|AnimateStageDescriptor|DataDescriptor|ImageDescriptor|SoundDescriptor)[];

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

/** Load instructions for PixiAnimate stage dependency assets */
export interface AnimateStageDescriptor extends AssetDescriptor {
    /** identifier of Animate stage for later retrieval from cache */
    id: string;
    /** `stage` property from PixiAnimate export */
    stage: AnimateStage;
    type: 'animate';
    /** should an instance of this Stage be saved on assets.animations? */
    cacheInstance?:boolean;
}

/** Stage of PixiAnimate export, includes asset dependency manifest */
export type AnimateStage = typeof PIXI.animate.MovieClip & {assets: {[key: string]: string}};

export interface AssetCache {
    /** references to data objects from loaded JSON files */
    data: { [key: string]: any };
    /** references to Textures for loaded Images */
    images: { [key: string]: PIXI.Texture };
    /** instances of loaded PixiAnimate stages - use these first when possible */
    animations: { [key: string]: PIXI.animate.MovieClip };
}