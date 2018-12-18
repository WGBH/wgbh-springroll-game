export default class AssetManager {

    /** references to data objects from loaded JSON files */
    public data: {[key: string]: any} = {};
    /** references to Textures for loaded Images */
    public images: {[key: string]: PIXI.Texture} = {};
    /** instances of loaded Sounds */
    public sounds: {[key: string]: PIXI.sound.Sound} = {};
    /** instances of loaded PixiAnimate stages - use these first when possible */
    public animations: {[key: string]: PIXI.animate.MovieClip} = {};

    /** IDs of cached assets that should persist between scenes */
    private globalCache:{shapes:string[], textures:string[], resources:string[], sounds:string[], data:string[], animations:string[]} = {
        shapes: [],
        textures: [],
        resources: [],
        sounds: [],
        data: [],
        animations: []
    };
 
    /**
     * loads assets for a Scene
     * @param assetList assets to be loaded
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
        this.executeLoads(globalList)
        .then(this.saveCacheState)
        .then(() => this.executeLoads(localList))
        .then(()=>{callback();});
    }

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

    private saveCacheState = () => {
        //TODO: de-dupe
        Object.keys(PIXI.animate.ShapesCache).forEach((key) => this.globalCache.shapes.push(key));
        Object.keys(PIXI.utils.TextureCache).forEach((key) => this.globalCache.textures.push(key));
        Object.keys(PIXI.loader.resources).forEach((key) => this.globalCache.resources.push(key));
    }

    /**
     * unload assets loaded via loadAssets
     * @param {boolean} includeGlobal  should global caches be cleared?
     */
    public unloadAssets(includeGlobal = false){
        if(includeGlobal){
            this.globalCache.animations.length = 0;
            this.globalCache.data.length = 0;
            this.globalCache.sounds.length = 0;
            this.globalCache.shapes.length = 0;
            this.globalCache.textures.length = 0;
            this.globalCache.resources.length = 0;
        }

        for(let id in this.animations){
            if(!this.globalCache.animations.includes(id)){
                this.animations[id].destroy();
                delete this.animations[id];
            }
        }
        for(let id in PIXI.utils.TextureCache){
            if(!this.globalCache.textures.includes(id)){
                (PIXI.utils.TextureCache[id] as PIXI.Texture).destroy(true);
                delete this.images[id];
            }
        }
        for(let id in PIXI.animate.ShapesCache){
            if(!this.globalCache.shapes.includes(id)){
                PIXI.animate.ShapesCache.remove(id);
            }
        }
        for(let id in this.sounds){
            if(!this.globalCache.sounds.includes(id)){
                delete this.sounds[id];
                PIXI.sound.remove(id);
            }
        }
        for(let id in PIXI.loader.resources){
            console.warn('unmanaged resource detected: ', id, PIXI.loader.resources[id]);
        }

        //TODO: should we touch this cache?
        // for(let id in PIXI.loader.resources){
        //     if(!this.globalCache.resources.includes(id)){
        //         let resource = PIXI.loader.resources[id];
        //         if(resource.type === PIXI.loaders.Resource.TYPE.AUDIO || resource.hasOwnProperty('sound')){
        //             console.warn('found a rogue sound', resource);
        //             continue;
        //             //((resource as any).sound as PIXI.sound.Sound).destroy();
        //         }
        //         else if(resource.type === PIXI.loaders.Resource.TYPE.IMAGE || resource.hasOwnProperty('texture') || resource.hasOwnProperty('textures')){
        //             if(resource.textures){
        //                 for(let key in resource.textures){
        //                     resource.textures[key].destroy();
        //                 }
        //             }
        //             if(resource.texture){
        //                 resource.texture.destroy();
        //             }
        //             delete this.images[id];
        //             delete PIXI.loader.resources[id];
        //         }
        //     }
        // }
    }

    private loadAnimate(animateStageDescriptor:AnimateStageDescriptor):Promise<any>{
        return new Promise((resolve) => {
            PIXI.animate.load(animateStageDescriptor.stage, (movieClip)=>{
                this.animations[animateStageDescriptor.id] = movieClip;
                if(animateStageDescriptor.isGlobal){
                    this.globalCache.animations.push(animateStageDescriptor.id);
                }
                resolve();
            });
        });
    }

    private loadImages(assets:ImageDescriptor[]):Promise<any>{
        let imageLoader = new PIXI.loaders.Loader();
        return new Promise((resolve)=>{
            for(let asset of assets){
                imageLoader.add(asset.id, asset.path);
            }
            imageLoader.load((loader:PIXI.loaders.Loader, resources:PIXI.loaders.ResourceDictionary)=>{
                for(let key of Object.keys(resources)){
                    this.images[key] = resources[key].texture;
                }
                imageLoader.destroy();
                resolve();
            });
        });
    }


    private loadSound(soundDescriptor:SoundDescriptor):Promise<void>{
        return new Promise((resolve)=>{
            let soundOptions:PIXI.sound.Options = {url: soundDescriptor.path, preload:soundDescriptor.preload !== false};
            if(soundDescriptor.volume !== undefined && typeof soundDescriptor.volume === 'number'){
                soundOptions.volume = soundDescriptor.volume;
            }
            if(soundOptions.preload){
                soundOptions.loaded = ()=>{ resolve(); };
            }

            this.sounds[soundDescriptor.id] = PIXI.sound.add(soundDescriptor.id, soundOptions);
            if(soundDescriptor.isGlobal){
                this.globalCache.sounds.push(soundDescriptor.id);
            }
            if(!soundOptions.preload){
                resolve();
            }
        });
    }

    private loadData(dataDescriptor:DataDescriptor):Promise<void>{
        return new Promise((resolve)=>{
            const request = new XMLHttpRequest();
            request.open('GET', dataDescriptor.path);
            request.onreadystatechange = ()=>{
                if ((request.status === 200) && (request.readyState === 4))
                {
                    this.data[dataDescriptor.id] = JSON.parse(request.responseText);
                    if(dataDescriptor.isGlobal){
                        this.globalCache.data.push(dataDescriptor.id);
                    }
                    resolve();
                }
            };
            request.send();
        });
    }

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

export type AssetList = (ManifestDescriptor|AnimateStageDescriptor|DataDescriptor|ImageDescriptor|SoundDescriptor)[];

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
    preload?:boolean;
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
}

/** Stage of PixiAnimate export, includes asset dependency manifest */
export type AnimateStage = typeof PIXI.animate.MovieClip & {assets: {[key: string]: string}};