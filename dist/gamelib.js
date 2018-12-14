var Game = /** @class */ (function () {
    function Game() {
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

var AssetManager = /** @class */ (function () {
    function AssetManager() {
        this.data = {};
        this.images = {};
        this.sounds = {};
        /** IDs of cached assets that should persist between scenes */
        this.globalCache = {
            shapes: [],
            textures: [],
            resources: []
        };
    }
    /**
     * loads assets for a Scene
     * @param assetList assets to be loaded
     */
    AssetManager.prototype.loadAssets = function (assetList, callback) {
        var _this = this;
        var manifests;
        for (var _i = 0, assetList_1 = assetList; _i < assetList_1.length; _i++) {
            var asset = assetList_1[_i];
            if (asset.type === 'manifest') {
                manifests.push(asset);
            }
        }
        if (manifests.length) ;
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
            var pixiAssets = [];
            for (var _i = 0, assetList_3 = assetList; _i < assetList_3.length; _i++) {
                var asset = assetList_3[_i];
                switch (asset.type) {
                    case 'animate':
                        loads.push(_this.loadAnimate(asset));
                        break;
                    case 'data':
                        loads.push(_this.loadData(asset));
                        break;
                    case 'image':
                    case 'sound':
                        pixiAssets.push(asset);
                        break;
                }
            }
            if (pixiAssets.length) {
                loads.push(_this.loadPixi(pixiAssets));
            }
        });
    };
    AssetManager.prototype.saveCacheState = function () {
        var _this = this;
        //TODO: de-dupe
        Object.keys(PIXI.animate.ShapesCache).forEach(function (key) { return _this.globalCache.shapes.push(key); });
        Object.keys(PIXI.utils.TextureCache).forEach(function (key) { return _this.globalCache.textures.push(key); });
        Object.keys(PIXI.loader.resources).forEach(function (key) { return _this.globalCache.resources.push(key); });
    };
    /**
     * unload assets loaded via loadAssets
     * @param {boolean} includeGlobal  should global caches be cleared?
     */
    AssetManager.prototype.unloadAssets = function (includeGlobal) {
        if (includeGlobal === void 0) { includeGlobal = false; }
        //if includeGlobal === false, cleanup all caches, excluding those in globalCache
        //else cleanup all caches
    };
    AssetManager.prototype.loadAnimate = function (animateStageDescriptor) {
        return new Promise(function (resolve) {
            PIXI.animate.load(animateStageDescriptor.stage, resolve);
        });
    };
    AssetManager.prototype.loadPixi = function (assets) {
        return new Promise(function (resolve) {
            for (var _i = 0, assets_1 = assets; _i < assets_1.length; _i++) {
                var asset = assets_1[_i];
                PIXI.loader.add(asset.id, asset.path);
            }
            PIXI.loader.load(resolve);
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

/// <reference types="pixi-animate" />

export { Game, Scene, StageManager, AssetManager };
//# sourceMappingURL=gamelib.js.map
