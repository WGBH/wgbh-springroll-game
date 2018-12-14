export default class AssetManager {

    public data: {[key: string]: any} = {};
    public images: {[key: string]: PIXI.Texture} = {};
    public sounds: {[key: string]: PIXI.sound.Sound} = {};

    /** IDs of cached assets that should persist between scenes */
    private globalCache:{shapes:string[], textures:string[], resources:string[]} = {
        shapes: [],
        textures: [],
        resources: []
    };
 
    /**
     * loads assets for a Scene
     * @param assetList assets to be loaded
     */
    public loadAssets(assetList:AssetList, callback:Function){
        let manifests:ManifestDescriptor[];
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
                    newList.concat(result);
                }
                this.loadAssets(newList, callback);
            });
            return;
        }

        const localList: AssetList = [];
        const globalList: AssetList = [];
        for(let asset of assetList){
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
            const pixiAssets: (ImageDescriptor|SoundDescriptor)[] = [];
            for(let asset of assetList){
                switch(asset.type){
                    case 'animate':
                        loads.push(this.loadAnimate(asset));
                        break;
                    case 'data':
                        loads.push(this.loadData(asset));
                        break;
                    case 'image':
                    case 'sound':
                        pixiAssets.push(asset);
                        break;
                }
            }
            if(pixiAssets.length){
                loads.push(this.loadPixi(pixiAssets));
            }
        });
    }

    private saveCacheState(){
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
        //if includeGlobal === false, cleanup all caches, excluding those in globalCache
        //else cleanup all caches
    }

    private loadAnimate(animateStageDescriptor:AnimateStageDescriptor):Promise<any>{
        return new Promise((resolve) => {
            PIXI.animate.load(animateStageDescriptor.stage, resolve);
        });
    }

    private loadPixi(assets:(SoundDescriptor|ImageDescriptor)[]):Promise<any[]>{
        return new Promise((resolve)=>{
            for(let asset of assets){
                PIXI.loader.add(asset.id, asset.path);
            }
            PIXI.loader.load(resolve);
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
export type AnimateStage = typeof PIXI.animate.MovieClip & {assets: {[key: string]: string}};