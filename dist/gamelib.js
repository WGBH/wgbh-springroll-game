var AssetManager = /** @class */ (function () {
    function AssetManager() {
        var _this = this;
        /** references to data objects from loaded JSON files */
        this.data = {};
        /** references to Textures for loaded Images */
        this.images = {};
        /** instances of loaded Sounds */
        this.sounds = {};
        /** instances of loaded PixiAnimate stages - use these first when possible */
        this.animations = {};
        /** IDs of cached assets that should persist between scenes */
        this.globalCache = {
            shapes: [],
            textures: [],
            resources: [],
            sounds: [],
            data: [],
            animations: []
        };
        this.saveCacheState = function () {
            //TODO: de-dupe
            Object.keys(PIXI.animate.ShapesCache).forEach(function (key) { return _this.globalCache.shapes.push(key); });
            Object.keys(PIXI.utils.TextureCache).forEach(function (key) { return _this.globalCache.textures.push(key); });
            Object.keys(PIXI.loader.resources).forEach(function (key) { return _this.globalCache.resources.push(key); });
        };
    }
    /**
     * loads assets for a Scene
     * @param assetList assets to be loaded
     */
    AssetManager.prototype.loadAssets = function (assetList, callback) {
        var _this = this;
        if (!assetList || !assetList.length) {
            return callback();
        }
        var manifests = [];
        for (var _i = 0, assetList_1 = assetList; _i < assetList_1.length; _i++) {
            var asset = assetList_1[_i];
            if (asset.type === 'manifest') {
                manifests.push(asset);
            }
        }
        if (manifests.length) {
            var loads = [];
            for (var i = 0; i < manifests.length; i++) {
                loads.push(this.loadManifest(manifests[i]));
            }
            Promise.all(loads).then(function (results) {
                //Merge manifests with asset list
                var newList = assetList.slice();
                for (var i = newList.length - 1; i >= 0; i--) {
                    if (newList[i].type === 'manifest') {
                        newList.splice(i, 1);
                    }
                }
                for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
                    var result = results_1[_i];
                    newList = newList.concat(result);
                }
                _this.loadAssets(newList, callback);
            });
            return;
        }
        var localList = [];
        var globalList = [];
        for (var _a = 0, assetList_2 = assetList; _a < assetList_2.length; _a++) {
            var asset = assetList_2[_a];
            asset.isGlobal ? globalList.push(asset) : localList.push(asset);
        }
        this.executeLoads(globalList)
            .then(this.saveCacheState)
            .then(function () { return _this.executeLoads(localList); })
            .then(function () { callback(); });
    };
    AssetManager.prototype.executeLoads = function (assetList) {
        var _this = this;
        return new Promise(function (resolve) {
            var loads = [];
            var imageAssets = [];
            for (var _i = 0, assetList_3 = assetList; _i < assetList_3.length; _i++) {
                var asset = assetList_3[_i];
                switch (asset.type) {
                    case 'animate':
                        loads.push(_this.loadAnimate(asset));
                        break;
                    case 'data':
                        loads.push(_this.loadData(asset));
                        break;
                    case 'sound':
                        loads.push(_this.loadSound(asset));
                        break;
                    case 'image':
                        imageAssets.push(asset);
                        break;
                }
            }
            if (imageAssets.length) {
                loads.push(_this.loadImages(imageAssets));
            }
            Promise.all(loads).then(resolve);
        });
    };
    /**
     * unload assets loaded via loadAssets
     * @param {boolean} includeGlobal  should global caches be cleared?
     */
    AssetManager.prototype.unloadAssets = function (includeGlobal) {
        if (includeGlobal === void 0) { includeGlobal = false; }
        if (includeGlobal) {
            this.globalCache.animations.length = 0;
            this.globalCache.data.length = 0;
            this.globalCache.sounds.length = 0;
            this.globalCache.shapes.length = 0;
            this.globalCache.textures.length = 0;
            this.globalCache.resources.length = 0;
        }
        for (var id in this.animations) {
            if (!this.globalCache.animations.includes(id)) {
                this.animations[id].destroy();
                delete this.animations[id];
            }
        }
        for (var id in PIXI.utils.TextureCache) {
            if (!this.globalCache.textures.includes(id)) {
                PIXI.utils.TextureCache[id].destroy(true);
                delete this.images[id];
            }
        }
        for (var id in PIXI.animate.ShapesCache) {
            if (!this.globalCache.shapes.includes(id)) {
                PIXI.animate.ShapesCache.remove(id);
            }
        }
        for (var id in this.sounds) {
            if (!this.globalCache.sounds.includes(id)) {
                delete this.sounds[id];
                PIXI.sound.remove(id);
            }
        }
        for (var id in PIXI.loader.resources) {
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
    };
    AssetManager.prototype.loadAnimate = function (animateStageDescriptor) {
        var _this = this;
        return new Promise(function (resolve) {
            PIXI.animate.load(animateStageDescriptor.stage, function (movieClip) {
                _this.animations[animateStageDescriptor.id] = movieClip;
                if (animateStageDescriptor.isGlobal) {
                    _this.globalCache.animations.push(animateStageDescriptor.id);
                }
                resolve();
            });
        });
    };
    AssetManager.prototype.loadImages = function (assets) {
        var _this = this;
        var imageLoader = new PIXI.loaders.Loader();
        return new Promise(function (resolve) {
            for (var _i = 0, assets_1 = assets; _i < assets_1.length; _i++) {
                var asset = assets_1[_i];
                imageLoader.add(asset.id, asset.path);
            }
            imageLoader.load(function (loader, resources) {
                for (var _i = 0, _a = Object.keys(resources); _i < _a.length; _i++) {
                    var key = _a[_i];
                    _this.images[key] = resources[key].texture;
                }
                imageLoader.destroy();
                resolve();
            });
        });
    };
    AssetManager.prototype.loadSound = function (soundDescriptor) {
        var _this = this;
        return new Promise(function (resolve) {
            var soundOptions = { url: soundDescriptor.path, preload: soundDescriptor.preload !== false };
            if (soundDescriptor.volume !== undefined && typeof soundDescriptor.volume === 'number') {
                soundOptions.volume = soundDescriptor.volume;
            }
            if (soundOptions.preload) {
                soundOptions.loaded = function () { resolve(); };
            }
            _this.sounds[soundDescriptor.id] = PIXI.sound.add(soundDescriptor.id, soundOptions);
            if (soundDescriptor.isGlobal) {
                _this.globalCache.sounds.push(soundDescriptor.id);
            }
            if (!soundOptions.preload) {
                resolve();
            }
        });
    };
    AssetManager.prototype.loadData = function (dataDescriptor) {
        var _this = this;
        return new Promise(function (resolve) {
            var request = new XMLHttpRequest();
            request.open('GET', dataDescriptor.path);
            request.onreadystatechange = function () {
                if ((request.status === 200) && (request.readyState === 4)) {
                    _this.data[dataDescriptor.id] = JSON.parse(request.responseText);
                    if (dataDescriptor.isGlobal) {
                        _this.globalCache.data.push(dataDescriptor.id);
                    }
                    resolve();
                }
            };
            request.send();
        });
    };
    AssetManager.prototype.loadManifest = function (manifestDescriptor) {
        return new Promise(function (resolve) {
            var request = new XMLHttpRequest();
            request.open('GET', manifestDescriptor.path);
            request.onreadystatechange = function () {
                if ((request.status === 200) && (request.readyState === 4)) {
                    var data = JSON.parse(request.responseText);
                    if (manifestDescriptor.isGlobal) {
                        for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
                            var entry = data_1[_i];
                            entry.isGlobal = true;
                        }
                    }
                    resolve(data);
                }
            };
            request.send();
        });
    };
    return AssetManager;
}());

var Game = /** @class */ (function () {
    function Game() {
        this.assets = new AssetManager();
        console.warn('we got constructed');
        console.warn('app', PIXI.Application);
    }
    Game.prototype.init = function () {
        console.warn('we got initted');
    };
    return Game;
}());

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

/**
 * Generic Scene base class
 */
var Scene = /** @class */ (function (_super) {
    __extends(Scene, _super);
    function Scene(game) {
        var _this = _super.call(this) || this;
        _this.game = game;
        return _this;
    }
    /**
     * asynchronous load tasks
     * @returns {Promise}
     */
    Scene.prototype.preload = function () {
        //Override this if you have stuff to preload - don't call super(), return your own Promise
        // add assets, and load them. Resolve a promise when it's all done
        return Promise.resolve();
    };
    /**
     * prepare initial visual state - called after preload is complete, while scene is obscured by loader
     */
    Scene.prototype.setup = function () {
        //override this, called to prepare graphics
    };
    /**
     * entrypoint to scene - called after loader transition is complete
     */
    Scene.prototype.start = function () {
        //override this - called to start scene
    };
    /**
     * callback for frame ticks
     * @param {number} deltaTime time since last frame in multiples of one frame's length of time.
     */
    Scene.prototype.update = function (deltaTime) {
        //override this to get update ticks
    };
    Scene.prototype.cleanup = function () {
        return Promise.reject('CLEANUP YOUR OWN STUFF!');
    };
    return Scene;
}(PIXI.Container));

var StageManager = /** @class */ (function () {
    function StageManager(transition) {
        this.hangCurtains(transition);
    }
    Object.defineProperty(StageManager.prototype, "currentScene", {
        get: function () {
            return this._currentScene;
        },
        enumerable: true,
        configurable: true
    });
    StageManager.prototype.hangCurtains = function (curtains) {
        var curtainLabels = [
            'cover',
            'cover_stop',
            'load',
            'load_loop',
            'reveal',
            'reveal_stop'
        ];
        for (var _i = 0, curtainLabels_1 = curtainLabels; _i < curtainLabels_1.length; _i++) {
            var label = curtainLabels_1[_i];
            if (!curtains.labelsMap.hasOwnProperty(label)) {
                console.error('Curtain MovieClip missing label: ', label);
                return;
            }
        }
        this.curtains = curtains;
        this.curtains.gotoAndStop('cover');
    };
    StageManager.prototype.changeScene = function (scene) {
        //blah
    };
    return StageManager;
}());

/// <reference types="pixi-animate" />

export { Game, Scene, StageManager, AssetManager };
//# sourceMappingURL=gamelib.js.map
