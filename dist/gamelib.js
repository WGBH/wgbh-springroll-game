import * as SpringRoll from 'springroll';
import { Property, ScaleManager, CaptionPlayer } from 'springroll';
import * as animate from '@pixi/animate';
import { load, Animator } from '@pixi/animate';
import { utils, Loader, Container } from 'pixi.js';
import { sound } from '@pixi/sound';
import { Application } from '@pixi/app';
import { Point } from '@pixi/math';
import { Ticker } from '@pixi/ticker';

/**
 * Manages loading, caching, and unloading of assets
 */
var AssetManager = /** @class */ (function () {
    function AssetManager(soundManager) {
        var _this = this;
        /** object containing references to cached instances of loaded assets */
        this.cache = { data: {}, images: {}, animations: {}, animateAssets: {}, spritesheets: {} };
        /** IDs of cached assets that should persist between scenes */
        this.globalCache = {
            shapes: [],
            textures: [],
            sounds: [],
            data: [],
            animations: [],
            spritesheets: []
        };
        /** IDs of loaded Sounds */
        this.soundIDs = [];
        this.sceneActive = false;
        /** Save current state of PIXI Global caches, to prevent unloading global assets */
        this.saveCacheState = function () {
            Object.keys(utils.TextureCache).forEach(function (key) {
                if (!_this.globalCache.textures.includes(key)) {
                    _this.globalCache.textures.push(key);
                }
            });
        };
        this.soundManager = soundManager;
    }
    /**
     * loads assets for a Scene
     * @param {AssetList} assetList assets to be loaded
     * @param {Function} callback called when all assets in assetList have been loaded
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
            if ((asset.type === 'animate' && this.globalCache.animations.includes(asset.id)) ||
                (asset.type === 'data' && this.globalCache.data.includes(asset.id)) ||
                (asset.type === 'sound' && this.globalCache.sounds.includes(asset.id)) ||
                (asset.type === 'image' && this.globalCache.textures.includes(asset.id))) {
                console.info('Using global asset: ', asset.id);
                continue;
            }
            asset.isGlobal ? globalList.push(asset) : localList.push(asset);
        }
        if (this.sceneActive && globalList.length) {
            console.error('Mid-Scene loading of global assets is unsupported - move these to preload() or disable global caching of all mid-Scene assets');
        }
        this.sceneActive = true;
        Promise.resolve()
            .then(function () { return _this.executeLoads(globalList); })
            .then(function () { return _this.saveCacheState(); })
            .then(function () { return _this.executeLoads(localList); })
            .then(function () { callback(); });
    };
    /** custom handling for loading different types of assets */
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
                    case 'spritesheet':
                        loads.push(_this.loadSpritesheet(asset));
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
     * @param {boolean} [includeGlobal = false]  should global caches be cleared?
     */
    AssetManager.prototype.unloadAssets = function (includeGlobal) {
        if (includeGlobal === void 0) { includeGlobal = false; }
        if (includeGlobal) {
            this.globalCache.animations.length = 0;
            this.globalCache.data.length = 0;
            this.globalCache.sounds.length = 0;
            this.globalCache.shapes.length = 0;
            this.globalCache.textures.length = 0;
            this.globalCache.spritesheets.length = 0;
        }
        for (var id in this.cache.animations) {
            if (!this.globalCache.animations.includes(id)) {
                if (this.cache.animations[id]) {
                    this.cache.animations[id].destroy();
                    delete this.cache.animations[id];
                }
            }
        }
        for (var id in this.cache.animateAssets) {
            if (!this.globalCache.animations.includes(id)) {
                for (var key in this.cache.animateAssets[id].shapes) {
                    delete this.cache.animateAssets[id].shapes[key];
                }
                for (var key in this.cache.animateAssets[id].textures) {
                    this.cache.animateAssets[id].textures[key].destroy(true);
                    delete this.cache.animateAssets[id].textures[key];
                }
                for (var _i = 0, _a = this.cache.animateAssets[id].spritesheets; _i < _a.length; _i++) {
                    var spritesheet = _a[_i];
                    spritesheet.destroy(true);
                }
                this.cache.animateAssets[id].spritesheets.length = 0;
                delete this.cache.animateAssets[id];
            }
        }
        for (var id in this.cache.spritesheets) {
            if (!this.globalCache.spritesheets.includes(id)) {
                for (var _b = 0, _c = Object.keys(this.cache.spritesheets[id].textures); _b < _c.length; _b++) {
                    var key = _c[_b];
                    this.cache.spritesheets[id].textures[key].destroy(true);
                }
                for (var _d = 0, _e = Object.keys(this.cache.spritesheets[id].animations); _d < _e.length; _d++) {
                    var key = _e[_d];
                    for (var _f = 0, _g = this.cache.spritesheets[id].animations[key]; _f < _g.length; _f++) {
                        var texture = _g[_f];
                        texture.destroy(true);
                    }
                }
                this.cache.spritesheets[id].destroy(true);
                delete this.cache.spritesheets[id];
            }
        }
        for (var id in utils.TextureCache) {
            if (!this.globalCache.textures.includes(id)) {
                utils.TextureCache[id].destroy(true);
                delete this.cache.images[id];
            }
        }
        for (var i = this.soundIDs.length - 1; i >= 0; i--) {
            var id = this.soundIDs[i];
            if (!this.globalCache.sounds.includes(id)) {
                this.soundManager.removeSound(id);
                this.soundIDs.splice(i, 1);
            }
        }
        for (var id in Loader.shared.resources) {
            console.warn('unmanaged resource detected: ', id, Loader.shared.resources[id]);
        }
        this.sceneActive = false;
    };
    /**
     * load assets for a PixiAnimate stage
     * @param {AnimateAssetDescriptor} animateAssetDescriptor
     */
    AssetManager.prototype.loadAnimate = function (animateAssetDescriptor) {
        var _this = this;
        return new Promise(function (resolve) {
            animateAssetDescriptor.asset.setup(animate);
            load(animateAssetDescriptor.asset, {
                createInstance: !!animateAssetDescriptor.cacheInstance,
                complete: function (movieClip) {
                    if (animateAssetDescriptor.cacheInstance) {
                        _this.cache.animations[animateAssetDescriptor.id] = movieClip;
                    }
                    if (animateAssetDescriptor.isGlobal) {
                        _this.globalCache.animations.push(animateAssetDescriptor.id);
                    }
                    _this.cache.animateAssets[animateAssetDescriptor.id] = animateAssetDescriptor.asset;
                    resolve();
                }
            });
        });
    };
    /**
     * Load list of individual image files to PIXI Textures
     * @param {ImageDescriptor[]} assets Array of imnages assets to load
     */
    AssetManager.prototype.loadImages = function (assets) {
        var _this = this;
        var imageLoader = new Loader();
        return new Promise(function (resolve) {
            for (var _i = 0, assets_1 = assets; _i < assets_1.length; _i++) {
                var asset = assets_1[_i];
                imageLoader.add(asset.id, asset.path);
            }
            imageLoader.load(function (loader, resources) {
                for (var _i = 0, _a = Object.keys(resources); _i < _a.length; _i++) {
                    var key = _a[_i];
                    _this.cache.images[key] = resources[key].texture;
                }
                imageLoader.destroy();
                resolve();
            });
        });
    };
    /**
     * Load an audio file to PIXI Sound
     * @param {SoundDescriptor} soundDescriptor
     */
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
            _this.soundManager.addSound(sound.add(soundDescriptor.id, soundOptions), soundDescriptor);
            _this.soundIDs.push(soundDescriptor.id);
            if (soundDescriptor.isGlobal) {
                _this.globalCache.sounds.push(soundDescriptor.id);
            }
            if (!soundOptions.preload) {
                resolve();
            }
        });
    };
    /**
     * Load JSON data
     * @param {DataDescriptor} dataDescriptor
     */
    AssetManager.prototype.loadData = function (dataDescriptor) {
        var _this = this;
        var dataLoader = new Loader();
        return new Promise(function (resolve) {
            dataLoader.add(dataDescriptor.id, dataDescriptor.path);
            dataLoader.load(function (loader, resources) {
                _this.cache.data[dataDescriptor.id] = resources[dataDescriptor.id].data;
                if (dataDescriptor.isGlobal) {
                    _this.globalCache.data.push(dataDescriptor.id);
                }
                dataLoader.destroy();
                resolve();
            });
        });
    };
    /**
     * Load Spritesheet data
     * @param {SpritesheetDescriptor} descriptor
     */
    AssetManager.prototype.loadSpritesheet = function (descriptor) {
        var _this = this;
        var dataLoader = new Loader();
        return new Promise(function (resolve) {
            dataLoader.add(descriptor.id, descriptor.path);
            dataLoader.load(function (loader, resources) {
                _this.cache.spritesheets[descriptor.id] = resources[descriptor.id].spritesheet;
                if (descriptor.isGlobal) {
                    _this.globalCache.spritesheets.push(descriptor.id);
                }
                dataLoader.destroy();
                resolve();
            });
        });
    };
    /**
     * Load JSON file containing an AssetList
     * @param {ManifestDescriptor} manifestDescriptor
     */
    AssetManager.prototype.loadManifest = function (manifestDescriptor) {
        var dataLoader = new Loader();
        return new Promise(function (resolve) {
            dataLoader.add(manifestDescriptor.path);
            dataLoader.load(function (loader, resources) {
                var data = resources[manifestDescriptor.path].data;
                dataLoader.destroy();
                if (manifestDescriptor.isGlobal) {
                    for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
                        var entry = data_1[_i];
                        entry.isGlobal = true;
                    }
                }
                resolve(data);
            });
        });
    };
    return AssetManager;
}());

/**
 *
 *  GameTime is a relay singleton that any object can hook into via its static subscribe() method to get the next tick of the game clock.
 *  Its update() should be called on any live tick of the game; determining whether the tick is live (e.g. checking paused) should happen elsewhere.
 *
 *  Call in the game's main tick/update function, using the static method on the class - GameTime.update(deltaTime);
 *  Subscribe to changes using static method on the class - GameTime.subscribe(callbackfunction)
 *
 */
var GameTime = /** @class */ (function () {
    function GameTime() {
    }
    GameTime.update = function (deltaTime) {
        for (var i = 0; i < this.listeners.length; i++) {
            this.listeners[i](deltaTime);
        }
        if (GameTime.gameTick.hasListeners) {
            GameTime.gameTick.value = deltaTime;
        }
    };
    /**
     * Adds an update listener
     * @param {function} callback The listener to call every frame update
     */
    GameTime.subscribe = function (callback) {
        GameTime.listeners.push(callback);
    };
    /**
     * Removes an update listener
     * @param {function} callback The listener to unsubscribe.
     */
    GameTime.unsubscribe = function (callback) {
        GameTime.listeners = GameTime.listeners.filter(function (listener) { return listener !== callback; });
    };
    GameTime.destroy = function () {
        GameTime.listeners.length = 0;
        GameTime.gameTick.value = null;
    };
    GameTime.listeners = [];
    /**
     * @deprecated use GameTime.subscribe() and GameTime.unsubscribe() directly instead
     */
    GameTime.gameTick = new Property(0, true);
    return GameTime;
}());

var PauseableTimer = /** @class */ (function () {
    function PauseableTimer(callback, time, loop) {
        var _this = this;
        this.active = true;
        this.paused = false;
        this.repeat = false;
        this.update = function (deltaTime) {
            if (_this.paused || !_this.targetTime) {
                return;
            }
            _this.currentTime += deltaTime;
            var time = _this.currentTime / _this.targetTime > 1 ? 1 : _this.currentTime / _this.targetTime;
            if (time >= 1) {
                if (_this.onComplete) {
                    _this.onComplete();
                }
                if (_this.repeat) {
                    var delta = _this.currentTime - _this.targetTime;
                    _this.reset(delta);
                }
                else {
                    _this.destroy(true);
                }
            }
        };
        this.targetTime = time;
        this.currentTime = 0;
        this.onComplete = callback;
        this.repeat = loop;
        GameTime.subscribe(this.update);
        PauseableTimer.timers.push(this);
    }
    PauseableTimer.clearTimers = function () {
        for (var _i = 0, _a = PauseableTimer.timers; _i < _a.length; _i++) {
            var timer = _a[_i];
            timer.destroy(false);
        }
    };
    Object.defineProperty(PauseableTimer.prototype, "promise", {
        get: function () {
            var _this = this;
            if (!this._promise) {
                this._promise = new Promise(function (resolve, reject) {
                    _this.resolve = resolve;
                    _this.reject = reject;
                });
            }
            return this._promise;
        },
        enumerable: false,
        configurable: true
    });
    PauseableTimer.prototype.pause = function (pause) {
        this.paused = pause;
    };
    PauseableTimer.prototype.reset = function (deltaTime) {
        // deltaTime shows how far over the end we went = do we care?
        this.currentTime = deltaTime ? deltaTime : 0;
    };
    PauseableTimer.prototype.destroy = function (isComplete) {
        if (isComplete === void 0) { isComplete = false; }
        this.paused = true; // make sure it doesn't try to do another update.
        if (isComplete) {
            if (this.resolve) {
                this.resolve();
            }
        }
        else if (this.reject) {
            this.reject('destroyed');
        }
        this._promise = null;
        this.resolve = null;
        this.reject = null;
        this.targetTime = null;
        this.onComplete = null;
        GameTime.unsubscribe(this.update);
        PauseableTimer.timers.splice(PauseableTimer.timers.indexOf(this), 1);
    };
    PauseableTimer.timers = [];
    return PauseableTimer;
}());

var LOADING_DELAY = 250;
/** Devices which are known/expected to flicker if Pixi's `transparent` mode is not enabled */
var FLICKERERS = [
    //Kindle fire tablets:
    // /KFMUWI/, /KFKAWI/, /KFSUWI/, /KFAUWI/, /KFDOWI/, /KFGIWI/, /KFFOWI/, /KFMEWI/, /KFTBWI/, /KFARWI/, /KFASWI/, /KFSAWA/, /KFSAWI/, /KFAPWA/, /KFAPWI/, /KFTHWA/, /KFTHWI/, /KFSOWI/, /KFJWA/, /KFJWI/,
    /KF.?.WI/,
    /KF.?.WA/,
    /KFTT/,
    /KFOT/,
    /Kindle Fire/,
    /Silk/,
    //Galaxy Tab A 7":
    /SM-T280/,
    //RCA tablets:
    // /RCT6077W2/, /RCT6103W46/, /RCT6203W46/, /RCT6272W23/, /RCT6303W87/, /RCT6378W2/, /RCT6773W22/, /RCT6773W42/, /RCT6873W42/, /RCT6973W43/,
    /RCT6\d\d\dW\d?\d/
];
var TRANSITION_ID = 'wgbhSpringRollGameTransition';
/**
 * Manages rendering and transitioning between Scenes
 */
var StageManager = /** @class */ (function () {
    function StageManager(game) {
        var _this = this;
        this.transitioning = true;
        this.isPaused = false;
        /** Map of Scenes by Scene IDs */
        this.scenes = {};
        /**
         * Transition to specified scene
         * @param {string} sceneID ID of Scene to transition to
         */
        this.changeScene = function (newScene) {
            var NewScene = _this.scenes[newScene];
            if (!NewScene) {
                throw new Error("No Scene found with ID \"".concat(newScene, "\""));
            }
            var oldScene = _this._currentScene;
            _this.transitioning = true;
            Promise.resolve()
                .then(function () {
                _this.pixi.stage.addChild(_this.transition);
                _this.transition.stop();
                if (oldScene) {
                    return new Promise(function (resolve) {
                        Animator.play(_this.transition, 'cover', resolve);
                    });
                }
            })
                .then(function () {
                Animator.play(_this.transition, 'load');
                if (oldScene) {
                    _this.pixi.stage.removeChild(oldScene);
                    oldScene.cleanup();
                    oldScene.destroy({ children: true });
                }
                _this.game.assetManager.unloadAssets();
            })
                .then(function () {
                return new Promise(function (resolve) {
                    setTimeout(resolve, LOADING_DELAY);
                });
            })
                .then(function () {
                _this._currentScene = new NewScene(_this.game);
                return _this._currentScene.preload();
            })
                .then(function (assetList) {
                if (assetList) {
                    return new Promise(function (resolve) {
                        _this.game.assetManager.loadAssets(assetList, resolve);
                    });
                }
            })
                .then(function () {
                return new Promise(function (resolve) {
                    setTimeout(resolve, LOADING_DELAY);
                });
            })
                .then(function () {
                return _this._currentScene.setup();
            })
                .then(function () {
                return new Promise(function (resolve) {
                    setTimeout(resolve, LOADING_DELAY);
                });
            })
                .then(function () {
                _this.pixi.stage.addChildAt(_this._currentScene, 0);
            })
                .then(function () {
                return new Promise(function (resolve) {
                    setTimeout(resolve, LOADING_DELAY);
                });
            })
                .then(function () {
                return new Promise(function (resolve) {
                    Animator.play(_this.transition, 'reveal', resolve);
                });
            })
                .then(function () {
                _this.transitioning = false;
                _this.pixi.stage.removeChild(_this.transition);
                _this._currentScene.start();
            });
        };
        this.gotResize = function (newsize) {
            _this.resize(newsize.width, newsize.height);
        };
        this.game = game;
    }
    Object.defineProperty(StageManager.prototype, "scale", {
        get: function () {
            console.warn('scale is obsolete, please reference viewFrame for stage size info');
            return 1;
        },
        enumerable: false,
        configurable: true
    });
    StageManager.prototype.createRenderer = function (containerID, width, height, altWidth, altHeight, playOptions) {
        if (altWidth && altHeight) {
            console.error('responsive scaling system only supports altWidth OR altHeight, using both will produce undesirable results');
        }
        this.width = width;
        this.height = height;
        this.offset = new Point(0, 0);
        // transparent rendering mode is bad for overall performance, but necessary in order
        // to prevent flickering on some Android devices such as Galaxy Tab A and Kindle Fire
        var flickerProne = !!FLICKERERS.find(function (value) { return value.test(navigator.userAgent); });
        // Does this version of Safari break antialiasing?
        var badSafari = navigator.userAgent.includes('Safari') && navigator.userAgent.includes('Version/15.4');
        // For Cordova:
        var cordovaWindow = window;
        if (cordovaWindow.device && cordovaWindow.device.platform === 'iOS' && cordovaWindow.device.version.startsWith('15.4')) {
            badSafari = true;
        }
        else if (playOptions && playOptions.cordova && playOptions.platform === 'iOS') {
            if (playOptions.osVersion) {
                badSafari = playOptions.osVersion.startsWith('15.4');
            }
            else {
                //if no osVersion provided by Games App, disable antialiasing on all iOS
                badSafari = true;
            }
        }
        this.pixi = new Application({ width: width, height: height, antialias: !badSafari, transparent: flickerProne });
        this.pixi.view.style.display = 'block';
        document.getElementById(containerID).appendChild(this.pixi.view);
        var baseSize = { width: width, height: height };
        altWidth = altWidth || width;
        altHeight = altHeight || height;
        var altSize = { width: altWidth, height: altHeight };
        var altBigger = altWidth > width || altHeight > height;
        var scale = {
            min: altBigger ? baseSize : altSize,
            max: altBigger ? altSize : baseSize
        };
        this.setScaling(scale);
        this.pixi.ticker.add(this.update.bind(this));
        this.scaleManager = new ScaleManager(this.gotResize);
    };
    StageManager.prototype.addCaptions = function (captionData, renderer) {
        this.captions = new CaptionPlayer(captionData, renderer);
    };
    StageManager.prototype.setCaptionRenderer = function (renderer) {
        if (this.captions) {
            this.captions.renderer = renderer;
        }
        else {
            console.warn('no captions player exists. call `addCaptions()` or include in GameOptions');
        }
    };
    StageManager.prototype.addScene = function (id, scene) {
        this.scenes[id] = scene;
    };
    StageManager.prototype.addScenes = function (sceneMap) {
        for (var id in sceneMap) {
            this.scenes[id] = sceneMap[id];
        }
    };
    StageManager.prototype.setTransition = function (asset, callback) {
        var _this = this;
        this.game.assetManager.loadAssets([
            { type: 'animate', asset: asset, id: TRANSITION_ID, isGlobal: true, cacheInstance: true }
        ], function () {
            _this.transition = _this.game.cache.animations[TRANSITION_ID];
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
                if (!_this.transition.labelsMap.hasOwnProperty(label)) {
                    console.error('Curtain MovieClip missing label: ', label);
                    return;
                }
            }
            _this.transition.gotoAndStop('cover');
            callback();
        });
    };
    Object.defineProperty(StageManager.prototype, "captionsMuted", {
        get: function () {
            return this.isCaptionsMuted;
        },
        set: function (muted) {
            this.isCaptionsMuted = muted;
            if (muted && this.captions) {
                this.captions.stop();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(StageManager.prototype, "pause", {
        get: function () {
            return this.isPaused;
        },
        set: function (pause) {
            this.isPaused = pause;
            if (this._currentScene) {
                this._currentScene.pause(pause);
            }
            if (this.pixi && this.pixi.ticker) {
                if (pause) {
                    Ticker.shared.stop();
                }
                else {
                    Ticker.shared.start();
                }
            }
        },
        enumerable: false,
        configurable: true
    });
    StageManager.prototype.getSize = function (width, height) {
        if (height === 0) {
            return null;
        }
        return {
            width: width,
            height: height,
            ratio: width / height
        };
    };
    StageManager.prototype.setScaling = function (scaleconfig) {
        if (scaleconfig.origin) {
            console.warn('origin is obsolete and will be ignored');
        }
        if (scaleconfig.min) {
            this._minSize = this.getSize(scaleconfig.min.width, scaleconfig.min.height);
        }
        if (scaleconfig.max) {
            this._maxSize = this.getSize(scaleconfig.max.width, scaleconfig.max.height);
        }
        this.resize(window.innerWidth, window.innerHeight);
    };
    StageManager.prototype.resize = function (width, height) {
        var aspect = width / height;
        var wideSize = this._maxSize.width > this._minSize.width ? this._maxSize : this._minSize;
        var tallSize = this._maxSize.height > this._minSize.height ? this._maxSize : this._minSize;
        var calcwidth;
        var calcheight;
        if (aspect > wideSize.ratio) {
            // locked in at max (2:1)
            calcwidth = wideSize.width;
            calcheight = wideSize.height;
            // these styles could - probably should - be replaced by media queries in CSS
            this.pixi.view.style.height = "".concat(height, "px");
            this.pixi.view.style.width = "".concat(Math.floor(wideSize.ratio * height), "px");
            this.pixi.view.style.margin = '0 auto';
        }
        else if (aspect < tallSize.ratio) {
            calcwidth = tallSize.width;
            calcheight = tallSize.height;
            var viewHeight = Math.floor(width / tallSize.ratio);
            this.pixi.view.style.height = "".concat(viewHeight, "px");
            this.pixi.view.style.width = "".concat(width, "px");
            this.pixi.view.style.margin = "".concat(Math.floor((height - viewHeight) / 2), "px 0");
        }
        else {
            // between min and max ratio
            if (wideSize.width !== tallSize.width) {
                var widthDiff = wideSize.width - tallSize.width;
                var aspectDiff = wideSize.ratio - tallSize.ratio;
                var diffRatio = (wideSize.ratio - aspect) / aspectDiff;
                calcwidth = wideSize.width - widthDiff * diffRatio;
                calcheight = wideSize.height;
            }
            else if (tallSize.height !== wideSize.height) {
                var heightDiff = tallSize.height - wideSize.height;
                var aspectDiff = wideSize.ratio - tallSize.ratio;
                var diffRatio = (aspect - tallSize.ratio) / aspectDiff;
                calcheight = tallSize.height - heightDiff * diffRatio;
                calcwidth = tallSize.width;
            }
            else {
                calcheight = tallSize.height;
                calcwidth = wideSize.width;
            }
            this.pixi.view.style.height = "".concat(height, "px");
            this.pixi.view.style.width = "".concat(width, "px");
            this.pixi.view.style.margin = '0';
        }
        var offset = (calcwidth - wideSize.width) * 0.5; // offset assumes that the upper left on MIN is 0,0 and the center is fixed
        var verticalOffset = (calcheight - tallSize.height) * 0.5;
        this.offset.x = offset;
        this.offset.y = verticalOffset;
        this.pixi.stage.position.copyFrom(this.offset);
        var newframe = {
            left: offset * -1,
            right: calcwidth - offset,
            width: calcwidth,
            center: calcwidth / 2 - offset,
            verticalCenter: calcheight / 2 - verticalOffset,
            top: 0,
            bottom: calcheight,
            height: calcheight,
            offset: this.offset,
            verticalOffset: verticalOffset
        };
        if (!this.viewFrame) {
            this.viewFrame = new Property(newframe);
        }
        else {
            this.viewFrame.value = newframe;
        }
        this.width = calcwidth;
        this.height = calcheight;
        /* legacy -- should remove */
        this.leftEdge = newframe.left;
        this.rightEdge = newframe.right;
        this.pixi.renderer.resize(calcwidth, calcheight);
        if (this._currentScene) {
            this._currentScene.resize(this.width, this.height, this.offset);
        }
    };
    /**
     *
     * globalToScene converts a "global" from PIXI into the scene level, taking into account the offset based on responsive resize
     *
     * @param pointin
     */
    StageManager.prototype.globalToScene = function (pointin) {
        return { x: pointin.x - this.offset.x, y: pointin.y - this.offset.y };
    };
    StageManager.prototype.addTimer = function (timer) {
        console.warn('StageManager.prototype.addTimer() is deprecated. PauseableTimers manage themselves');
    };
    StageManager.prototype.clearTimers = function () {
        console.warn('StageManager.prototype.clearTimers() is deprecated. use PauseableTimer.clearTimers() instead');
        PauseableTimer.clearTimers();
    };
    StageManager.prototype.showCaption = function (captionid, begin, args) {
        if (this.isCaptionsMuted || !this.captions) {
            return;
        }
        begin = begin || 0;
        this.captions.start(captionid, begin, args);
    };
    StageManager.prototype.stopCaption = function () {
        if (!this.captions) {
            return;
        }
        this.captions.stop();
    };
    StageManager.prototype.update = function () {
        // if the game is paused, or there isn't a scene, we can skip rendering/updates  
        if (this.isPaused) {
            return;
        }
        var elapsed = Ticker.shared.elapsedMS;
        if (this.captions) {
            this.captions.update(elapsed / 1000); // captions go by seconds, not ms
        }
        GameTime.update(elapsed);
        if (this.transitioning || !this._currentScene) {
            return;
        }
        this._currentScene.update(elapsed);
    };
    return StageManager;
}());

var SoundContext = /** @class */ (function () {
    function SoundContext(issingle) {
        var _this = this;
        /** Map of Sounds by ID */
        this.sounds = {};
        /** Map of individual Sound volumes by ID */
        this.volumes = {};
        this._globalVolume = 1;
        this._volume = 1;
        this.single = false;
        this.singlePlayComplete = function (soundInstance) {
            _this.currentSound = null;
            if (_this.singleCallback) {
                var call = _this.singleCallback;
                _this.singleCallback = null;
                call(soundInstance);
            }
        };
        this.single = (issingle === true);
        this.currentSound = null;
    }
    Object.defineProperty(SoundContext.prototype, "volume", {
        /** Context-specific volume */
        set: function (volume) {
            this._volume = volume;
            for (var key in this.sounds) {
                this.applyVolume(key);
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SoundContext.prototype, "globalVolume", {
        /** Volume applied to all contexts */
        set: function (volume) {
            this._globalVolume = volume;
            for (var key in this.sounds) {
                this.applyVolume(key);
            }
        },
        enumerable: false,
        configurable: true
    });
    /**
     *
     * @param {pixiSound.Sound} soundInstance Sound instance to add
     * @param {string} id ID of sound to add
     * @param {number} volume Number 0-1 of volume for this sound
     */
    SoundContext.prototype.addSound = function (soundInstance, id, volume) {
        if (volume === void 0) { volume = 1; }
        if (this.sounds[id]) {
            console.error('Sound already added with id: ', id);
        }
        this.sounds[id] = soundInstance;
        this.volumes[id] = volume;
        this.applyVolume(id);
    };
    /**
     * Adjust volume of a specific sound by ID
     * @param {string} id ID of sound to set volume on
     * @param {number} volume Number 0-1 to set volume of specified sound
     */
    SoundContext.prototype.applyVolume = function (id, volume) {
        if (volume !== undefined) {
            this.volumes[id] = volume;
        }
        this.sounds[id].volume = this.volumes[id] * this._globalVolume * this._volume;
    };
    /**
     *
     * @param {string} id
     * @param {CompleteCallback} onComplete
     */
    SoundContext.prototype.play = function (id, onComplete) {
        if (this.single) {
            if (this.currentSound) {
                // stop currently playing sound
                this.stop(this.currentSound);
            }
            this.singleCallback = onComplete;
        }
        this.currentSound = id;
        return this.sounds[id].play(this.single ? this.singlePlayComplete : onComplete);
    };
    SoundContext.prototype.stop = function (id) {
        if (id === this.currentSound) {
            this.currentSound = null;
            this.singleCallback = null;
        }
        if (this.sounds[id]) {
            this.sounds[id].stop();
        }
    };
    SoundContext.prototype.stopAll = function () {
        this.currentSound = null;
        for (var key in this.sounds) {
            this.sounds[key].stop();
        }
    };
    /**
     *
     * @param soundid ID of sound to get position of - if none, then find position of most recently played sound
     */
    SoundContext.prototype.getPosition = function (soundid) {
        if (!soundid) {
            soundid = this.currentSound;
        }
        if (!this.sounds[soundid] || !this.sounds[soundid].isPlaying) {
            return -1;
        }
        return this.sounds[soundid].instances[0].progress; // NOTE: There seems to be a Safari bug where the progress listener can become detached from a sound...may need a fallback or workaround
    };
    SoundContext.prototype.getPositionSeconds = function (soundid) {
        if (!soundid) {
            soundid = this.currentSound;
        }
        if (!this.sounds[soundid] || !this.sounds[soundid].isPlaying) {
            return -1;
        }
        return this.sounds[soundid].instances[0].progress * this.sounds[soundid].duration; // NOTE: There seems to be a Safari bug where the progress listener can become detached from a sound...may need a fallback or workaround
    };
    SoundContext.prototype.isPlaying = function () {
        for (var key in this.sounds) {
            if (this.sounds[key].isPlaying) {
                return true;
            }
        }
        return false;
    };
    /**
     * Destroy sound, remove from context and PIXI Sound cache
     * @param id ID of sound to remove
     */
    SoundContext.prototype.removeSound = function (id) {
        sound.remove(id);
        delete this.sounds[id];
        delete this.volumes[id];
        if (id === this.currentSound) {
            this.currentSound = null;
        }
    };
    return SoundContext;
}());

/**
 * Manages Sound playback, pausing, resuming, and volume control
 */
var SoundManager = /** @class */ (function () {
    function SoundManager() {
        /** Context for managing SFX sounds */
        this.sfx = new SoundContext();
        /** Context for managing VO sounds */
        this.vo = new SoundContext(true);
        /** Context for managing music sounds */
        this.music = new SoundContext();
        /** Mapping of which SoundContexts each Sound belongs to, by ID */
        this.soundMeta = {};
    }
    Object.defineProperty(SoundManager.prototype, "volume", {
        /** Global volume of all SoundContexts */
        set: function (volume) {
            this.sfx.globalVolume = volume;
            this.vo.globalVolume = volume;
            this.music.globalVolume = volume;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SoundManager.prototype, "sfxVolume", {
        /** Volume of all sounds in SFX context */
        set: function (volume) {
            this.sfx.volume = volume;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SoundManager.prototype, "voVolume", {
        /** Volume of all sounds in VO context */
        set: function (volume) {
            this.vo.volume = volume;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SoundManager.prototype, "musicVolume", {
        /** Volume of all sounds in Music context */
        set: function (volume) {
            this.music.volume = volume;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Add sound to a SoundManager Context
     * @param {Sound} sound Sound instance to add
     * @param {SoundDescriptor} descriptor Asset load metadata for Sound
     */
    SoundManager.prototype.addSound = function (soundInstance, descriptor) {
        var context = this[descriptor.context || 'sfx'];
        this.soundMeta[descriptor.id] = context;
        context.addSound(soundInstance, descriptor.id, descriptor.volume);
    };
    /**
     * Play sound by ID
     * @param {string} soundID ID of Sound to play
     * @param {pixiSound.CompleteCallback} [onComplete] Called when Sound is finished playing
     * @returns {pixiSound.IMediaInstance | Promise<pixiSound.IMediaInstance>} instace of playing sound (or promise of to-be-played sound if not preloaded)
     */
    SoundManager.prototype.play = function (soundID, onComplete) {
        return this.soundMeta[soundID].play(soundID, onComplete);
        // return this.soundMeta[soundID].sounds[soundID].play(onComplete);
    };
    SoundManager.prototype.stop = function (soundID) {
        this.soundMeta[soundID].stop(soundID);
    };
    /** Retrieve reference to Sound instance by ID
     * @param {string} soundID ID of sound to retrieve
     * @returns {pixiSound.Sound} Sound instance
     */
    SoundManager.prototype.getSound = function (soundID) {
        return this.soundMeta[soundID].sounds[soundID];
    };
    /**
     * Retrieve reference to the SoundContext by ID
     *
     * @param soundID ID of sound to look up
     * @returns {SoundContext}
     */
    SoundManager.prototype.getContext = function (soundID) {
        return this.soundMeta[soundID];
    };
    /**
     * Pause specified Sound by ID - if no ID provided, pause all sounds
     * @param {string} [soundID] ID of sound to pause - if undefined, pause all sounds
     */
    SoundManager.prototype.pause = function (soundID) {
        if (!soundID) {
            sound.pauseAll();
        }
        else {
            this.getSound(soundID).pause();
        }
    };
    /**
     * Resume specified Sound by ID - if no ID provided, resume all sounds
     * @param {string} [soundID] ID of sound to resume - if undefined, resume all sounds
     */
    SoundManager.prototype.resume = function (soundID) {
        if (!soundID) {
            sound.resumeAll();
        }
        else {
            this.getSound(soundID).resume();
        }
    };
    /**
     * Adjust volume of a specific sound by ID
     * @param {string} id ID of sound to set volume on
     * @param {number} volume Number 0-1 to set volume of specified sound
     */
    SoundManager.prototype.setVolume = function (id, volume) {
        this.soundMeta[id].applyVolume(id, volume);
    };
    /**
     * Destroy sound, remove from context and PIXI Sound cache
     * @param id ID of sound to remove
     */
    SoundManager.prototype.removeSound = function (id) {
        var context = this.soundMeta[id];
        context.removeSound(id);
        delete this.soundMeta[id];
    };
    return SoundManager;
}());

/** Base Class for WGBH SpringRoll Games - extend this Class in your project */
var Game = /** @class */ (function () {
    function Game(options) {
        var _this = this;
        /** object for storing global data - accessible from all Scenes */
        this.dataStore = {};
        this.preloadGlobal = function () {
            var assets = _this.preload();
            if (assets && assets.length) {
                for (var _i = 0, assets_1 = assets; _i < assets_1.length; _i++) {
                    var asset = assets_1[_i];
                    //Game-level assets are always global
                    asset.isGlobal = true;
                }
                _this.assetManager.unloadAssets(); //Prep for fresh loading
                _this.assetManager.loadAssets(assets, _this.gameReady.bind(_this));
            }
            else {
                _this.gameReady();
            }
        };
        this.sound = new SoundManager();
        this.assetManager = new AssetManager(this.sound);
        this.cache = this.assetManager.cache;
        this.stageManager = new StageManager(this);
        this.app = new SpringRoll.Application(options.springRollConfig);
        // Wait until playOptions received before creating renderer
        // Wait until renderer created before creating transition
        var rendererInitialized = false;
        var applicationReady = false;
        var initializeRenderer = function (playOptions) {
            if (!rendererInitialized) {
                _this.stageManager.createRenderer(options.containerID, options.width, options.height, options.altWidth, options.altHeight, playOptions);
                if (applicationReady) {
                    _this.stageManager.setTransition(options.transition, _this.preloadGlobal);
                }
                rendererInitialized = true;
            }
        };
        //If loaded in an iFrame, wait for playOptions from SpringRoll Container
        if (options.noContainer || window.self === window.top) {
            initializeRenderer();
        }
        else {
            this.app.state.playOptions.subscribe(initializeRenderer);
        }
        if (options.springRollConfig.features.sound || options.springRollConfig.features.soundVolume) {
            this.app.state.soundVolume.subscribe(function (volume) {
                _this.sound.volume = volume;
            });
            if (options.springRollConfig.features.music || options.springRollConfig.features.musicVolume) {
                this.app.state.musicVolume.subscribe(function (volume) {
                    _this.sound.musicVolume = volume;
                });
            }
            if (options.springRollConfig.features.sfx || options.springRollConfig.features.sfxVolume) {
                this.app.state.sfxVolume.subscribe(function (volume) {
                    _this.sound.sfxVolume = volume;
                });
            }
            if (options.springRollConfig.features.vo || options.springRollConfig.features.voVolume) {
                this.app.state.voVolume.subscribe(function (volume) {
                    _this.sound.voVolume = volume;
                });
            }
        }
        this.app.state.pause.subscribe(function (pause) {
            if (_this.stageManager.pause !== pause) {
                pause ? _this.sound.pause() : _this.sound.resume();
                _this.stageManager.pause = pause;
            }
        });
        if (options.springRollConfig.features.captions) {
            this.app.state.captionsMuted.subscribe(function (isMuted) {
                _this.stageManager.captionsMuted = isMuted;
            });
        }
        this.app.state.ready.subscribe(function () {
            if (rendererInitialized) {
                _this.stageManager.setTransition(options.transition, _this.preloadGlobal);
            }
            applicationReady = true;
        });
        if (options.captions && options.captions.config) {
            this.stageManager.addCaptions(options.captions.config, options.captions.display);
        }
    }
    /** Add plugin to this instance of SpringRoll */
    Game.addPlugin = function (plugin) {
        SpringRoll.Application.uses(plugin);
    };
    /** overrride and return list of global assets */
    Game.prototype.preload = function () {
        return null;
    };
    /** called when game is ready to enter first scene - override this function and set first scene here */
    Game.prototype.gameReady = function () {
        //override and set first scene in this function
    };
    Game.prototype.addScene = function (id, scene) {
        this.stageManager.addScene(id, scene);
    };
    Game.prototype.addScenes = function (sceneMap) {
        this.stageManager.addScenes(sceneMap);
    };
    /**
     * Transition to specified scene
     * @param {string} sceneID ID of Scene to transition to
     */
    Game.prototype.changeScene = function (sceneID) {
        this.stageManager.changeScene(sceneID);
    };
    return Game;
}());

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

function backInOut(t) {
  var s = 1.70158 * 1.525;
  if ((t *= 2) < 1)
    return 0.5 * (t * t * ((s + 1) * t - s))
  return 0.5 * ((t -= 2) * t * ((s + 1) * t + s) + 2)
}

var backInOut_1 = backInOut;

function backIn(t) {
  var s = 1.70158;
  return t * t * ((s + 1) * t - s)
}

var backIn_1 = backIn;

function backOut(t) {
  var s = 1.70158;
  return --t * t * ((s + 1) * t + s) + 1
}

var backOut_1 = backOut;

function bounceOut(t) {
  var a = 4.0 / 11.0;
  var b = 8.0 / 11.0;
  var c = 9.0 / 10.0;

  var ca = 4356.0 / 361.0;
  var cb = 35442.0 / 1805.0;
  var cc = 16061.0 / 1805.0;

  var t2 = t * t;

  return t < a
    ? 7.5625 * t2
    : t < b
      ? 9.075 * t2 - 9.9 * t + 3.4
      : t < c
        ? ca * t2 - cb * t + cc
        : 10.8 * t * t - 20.52 * t + 10.72
}

var bounceOut_1 = bounceOut;

function bounceInOut(t) {
  return t < 0.5
    ? 0.5 * (1.0 - bounceOut_1(1.0 - t * 2.0))
    : 0.5 * bounceOut_1(t * 2.0 - 1.0) + 0.5
}

var bounceInOut_1 = bounceInOut;

function bounceIn(t) {
  return 1.0 - bounceOut_1(1.0 - t)
}

var bounceIn_1 = bounceIn;

function circInOut(t) {
  if ((t *= 2) < 1) return -0.5 * (Math.sqrt(1 - t * t) - 1)
  return 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1)
}

var circInOut_1 = circInOut;

function circIn(t) {
  return 1.0 - Math.sqrt(1.0 - t * t)
}

var circIn_1 = circIn;

function circOut(t) {
  return Math.sqrt(1 - ( --t * t ))
}

var circOut_1 = circOut;

function cubicInOut(t) {
  return t < 0.5
    ? 4.0 * t * t * t
    : 0.5 * Math.pow(2.0 * t - 2.0, 3.0) + 1.0
}

var cubicInOut_1 = cubicInOut;

function cubicIn(t) {
  return t * t * t
}

var cubicIn_1 = cubicIn;

function cubicOut(t) {
  var f = t - 1.0;
  return f * f * f + 1.0
}

var cubicOut_1 = cubicOut;

function elasticInOut(t) {
  return t < 0.5
    ? 0.5 * Math.sin(+13.0 * Math.PI/2 * 2.0 * t) * Math.pow(2.0, 10.0 * (2.0 * t - 1.0))
    : 0.5 * Math.sin(-13.0 * Math.PI/2 * ((2.0 * t - 1.0) + 1.0)) * Math.pow(2.0, -10.0 * (2.0 * t - 1.0)) + 1.0
}

var elasticInOut_1 = elasticInOut;

function elasticIn(t) {
  return Math.sin(13.0 * t * Math.PI/2) * Math.pow(2.0, 10.0 * (t - 1.0))
}

var elasticIn_1 = elasticIn;

function elasticOut(t) {
  return Math.sin(-13.0 * (t + 1.0) * Math.PI/2) * Math.pow(2.0, -10.0 * t) + 1.0
}

var elasticOut_1 = elasticOut;

function expoInOut(t) {
  return (t === 0.0 || t === 1.0)
    ? t
    : t < 0.5
      ? +0.5 * Math.pow(2.0, (20.0 * t) - 10.0)
      : -0.5 * Math.pow(2.0, 10.0 - (t * 20.0)) + 1.0
}

var expoInOut_1 = expoInOut;

function expoIn(t) {
  return t === 0.0 ? t : Math.pow(2.0, 10.0 * (t - 1.0))
}

var expoIn_1 = expoIn;

function expoOut(t) {
  return t === 1.0 ? t : 1.0 - Math.pow(2.0, -10.0 * t)
}

var expoOut_1 = expoOut;

function linear(t) {
  return t
}

var linear_1 = linear;

function quadInOut(t) {
    t /= 0.5;
    if (t < 1) return 0.5*t*t
    t--;
    return -0.5 * (t*(t-2) - 1)
}

var quadInOut_1 = quadInOut;

function quadIn(t) {
  return t * t
}

var quadIn_1 = quadIn;

function quadOut(t) {
  return -t * (t - 2.0)
}

var quadOut_1 = quadOut;

function quarticInOut(t) {
  return t < 0.5
    ? +8.0 * Math.pow(t, 4.0)
    : -8.0 * Math.pow(t - 1.0, 4.0) + 1.0
}

var quartInOut = quarticInOut;

function quarticIn(t) {
  return Math.pow(t, 4.0)
}

var quartIn = quarticIn;

function quarticOut(t) {
  return Math.pow(t - 1.0, 3.0) * (1.0 - t) + 1.0
}

var quartOut = quarticOut;

function qinticInOut(t) {
    if ( ( t *= 2 ) < 1 ) return 0.5 * t * t * t * t * t
    return 0.5 * ( ( t -= 2 ) * t * t * t * t + 2 )
}

var quintInOut = qinticInOut;

function qinticIn(t) {
  return t * t * t * t * t
}

var quintIn = qinticIn;

function qinticOut(t) {
  return --t * t * t * t * t + 1
}

var quintOut = qinticOut;

function sineInOut(t) {
  return -0.5 * (Math.cos(Math.PI*t) - 1)
}

var sineInOut_1 = sineInOut;

function sineIn (t) {
  var v = Math.cos(t * Math.PI * 0.5);
  if (Math.abs(v) < 1e-14) return 1
  else return 1 - v
}

var sineIn_1 = sineIn;

function sineOut(t) {
  return Math.sin(t * Math.PI/2)
}

var sineOut_1 = sineOut;

var eases = {
	'backInOut': backInOut_1,
	'backIn': backIn_1,
	'backOut': backOut_1,
	'bounceInOut': bounceInOut_1,
	'bounceIn': bounceIn_1,
	'bounceOut': bounceOut_1,
	'circInOut': circInOut_1,
	'circIn': circIn_1,
	'circOut': circOut_1,
	'cubicInOut': cubicInOut_1,
	'cubicIn': cubicIn_1,
	'cubicOut': cubicOut_1,
	'elasticInOut': elasticInOut_1,
	'elasticIn': elasticIn_1,
	'elasticOut': elasticOut_1,
	'expoInOut': expoInOut_1,
	'expoIn': expoIn_1,
	'expoOut': expoOut_1,
	'linear': linear_1,
	'quadInOut': quadInOut_1,
	'quadIn': quadIn_1,
	'quadOut': quadOut_1,
	'quartInOut': quartInOut,
	'quartIn': quartIn,
	'quartOut': quartOut,
	'quintInOut': quintInOut,
	'quintIn': quintIn,
	'quintOut': quintOut,
	'sineInOut': sineInOut_1,
	'sineIn': sineIn_1,
	'sineOut': sineOut_1
};

var Eases = eases;
var Tween = /** @class */ (function () {
    function Tween(target) {
        var _this = this;
        this.paused = false;
        this.steps = [];
        this.currentStep = 0;
        this.loop = 0;
        this.to = function (targetValues, totalTime, ease) {
            if (ease === void 0) { ease = 'linear'; }
            _this.steps.push({ targetValues: targetValues, totalTime: totalTime, ease: Eases[ease] });
            return _this;
        };
        this.wait = function (totalTime) {
            _this.steps.push({ totalTime: totalTime });
            return _this;
        };
        this.call = function (call) {
            _this.steps.push({ call: call });
            return _this;
        };
        this.doComplete = function () {
            if (_this.onComplete) {
                _this.onComplete();
            }
            if (_this._resolve) {
                _this._resolve();
            }
            _this.destroy();
        };
        this.update = function (elapsed) {
            if (_this.paused) {
                return;
            }
            if (_this.steps.length <= _this.currentStep) {
                if (_this.loop) {
                    if (_this.loop > 0) {
                        _this.loop--;
                    }
                    _this.currentStep = 0;
                    for (var _i = 0, _a = _this.steps; _i < _a.length; _i++) {
                        var step_1 = _a[_i];
                        step_1.currentTime = 0;
                    }
                }
                else {
                    return _this.doComplete();
                }
            }
            var step = _this.steps[_this.currentStep];
            if (step.call) {
                _this.currentStep++;
                return step.call();
            }
            if (!step.currentTime) {
                step.currentTime = 0;
                if (step.targetValues) {
                    step.initialValues = {};
                    for (var key in step.targetValues) {
                        step.initialValues[key] = _this.target[key];
                    }
                }
            }
            step.currentTime += elapsed;
            var time = step.currentTime / step.totalTime > 1 ? 1 : step.currentTime / step.totalTime;
            if (step.targetValues) {
                for (var key in step.targetValues) {
                    _this.target[key] = step.initialValues[key] + step.ease(time) * (step.targetValues[key] - step.initialValues[key]);
                }
            }
            if (time >= 1) {
                _this.currentStep++;
            }
        };
        this.target = target;
    }
    Tween.get = function (target, options) {
        if (options === void 0) { options = {}; }
        if (options.override) {
            this.removeTweens(target);
        }
        var tween = new Tween(target);
        if (options.loop) {
            if (options.loop % 1) {
                console.error('Tween options.loop must be an integer. Got: ', options.loop);
            }
            tween.loop = options.loop;
        }
        if (options.onComplete) {
            tween.onComplete = options.onComplete;
        }
        Tween.tweens.push(tween);
        GameTime.subscribe(tween.update);
        return tween;
    };
    Tween.removeTweens = function (target) {
        for (var i = Tween.tweens.length - 1; i >= 0; i--) {
            if (Tween.tweens[i].target === target) {
                Tween.tweens[i].destroy();
            }
        }
    };
    Tween.removeAllTweens = function () {
        for (var i = Tween.tweens.length - 1; i >= 0; i--) {
            Tween.tweens[i].destroy();
        }
    };
    Object.defineProperty(Tween.prototype, "promise", {
        get: function () {
            var _this = this;
            if (!this._promise) {
                this._promise = new Promise(function (resolve) { _this._resolve = resolve; });
            }
            return this._promise;
        },
        enumerable: false,
        configurable: true
    });
    Tween.prototype.destroy = function () {
        GameTime.unsubscribe(this.update);
        if (Tween.tweens.includes(this)) {
            Tween.tweens.splice(Tween.tweens.indexOf(this), 1);
        }
        this.target = null;
        this.steps = null;
        this.currentStep = null;
        this._promise = null;
        this._resolve = null;
    };
    Tween.tweens = [];
    return Tween;
}());

/**
 * Generic Scene base class, parent container for all art and functionality in a given scene
 */
var Scene = /** @class */ (function (_super) {
    __extends(Scene, _super);
    function Scene(game) {
        var _this = _super.call(this) || this;
        _this.app = game.app;
        _this.assetManager = game.assetManager;
        _this.cache = _this.assetManager.cache;
        _this.sound = game.sound;
        _this.stageManager = game.stageManager;
        _this.dataStore = game.dataStore;
        return _this;
    }
    /**
     * Provide list of assets to preload.
     * Optionally, return a Promise which may return a list of assets to preload.
     * @returns {AssetList | Promise<AssetList>}
     */
    Scene.prototype.preload = function () {
        return;
    };
    /**
     * Exit this Scene and transition to specified scene
     * @param {string} sceneID ID of Scene to transition to
     */
    Scene.prototype.changeScene = function (sceneID) {
        this.stageManager.changeScene(sceneID);
    };
    /**
     * Prepare initial visual state - called after preload is complete, while scene is obscured by loader.
     * Optionally return a Promise, which will delay removal of the loader until it is resolved.
     * @returns {Promise<any> | void}
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
     * pause scene - override this if you need to pause functionality of your scene
     * when the rendering and sound is paused
     * @param paused whether or not the game is being paused (false if being resumed)
     */
    Scene.prototype.pause = function (paused) {
        //override this if you have custom timed functionality that should be paused
        //with the rest of the game
    };
    /**
     * callback for frame ticks
     * @param {number} deltaTime time since last frame in milliseconds.
     */
    Scene.prototype.update = function (deltaTime) {
        //override this to get update ticks
    };
    /**
     * Simple tween target's numeric properties to specified values over time with easinbg
     * @param target object with values to tween
     * @param values numeric end values of tweening target, keyed by target property names
     * @param time number of frames over which to tween target values
     * @param [ease] name of easing curve to apply to tween
     * @returns {Tween} instance of Tween, for pausing/cancelling
     */
    Scene.prototype.tween = function (target, values, time, ease) {
        console.warn('Scene.tween() is deprecated, please use Tween.get()');
        return Tween.get(target).to(values, time, ease);
    };
    /**
     *
     * Replacement for the window.setTimeout, this timeout will pause when the game is paused.
     * Similar to Tween
     *
     * @param callback
     * @param time
     */
    Scene.prototype.setTimeout = function (callback, time) {
        return new PauseableTimer(callback, time);
    };
    Scene.prototype.clearTimeout = function (timer) {
        if (timer) {
            timer.destroy(false); // destroy without triggering the callback function
        }
    };
    Scene.prototype.setInterval = function (callback, time) {
        return new PauseableTimer(callback, time, true);
    };
    Scene.prototype.clearInterval = function (timer) {
        if (timer) {
            timer.destroy(false); // destroy without triggering the callback function
        }
    };
    Scene.prototype.resize = function (width, height, offset) {
        // in case something special needs to happen on resize
    };
    /**
     * Called when Scene is about to transition out - override to clean up art or other objects in memory
     * @returns {void} return a Promise to resolve when any asynchronous cleanup is complete
     */
    Scene.prototype.cleanup = function () {
        //override this to clean up Scene
    };
    return Scene;
}(Container));

export { AssetManager, Game, GameTime, PauseableTimer, Scene, SoundContext, SoundManager, StageManager, Tween };
//# sourceMappingURL=gamelib.js.map
