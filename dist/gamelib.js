import { ScaleManager, Application } from 'springroll';
import { Tween, Ease } from '@createjs/tweenjs';

/**
 * Manages loading, caching, and unloading of assets
 */
var AssetManager = /** @class */ (function () {
    function AssetManager(soundManager) {
        var _this = this;
        /** object containing references to cached instances of loaded assets */
        this.cache = { data: {}, images: {}, animations: {} };
        /** IDs of cached assets that should persist between scenes */
        this.globalCache = {
            shapes: [],
            textures: [],
            sounds: [],
            data: [],
            animations: []
        };
        /** IDs of loaded Sounds */
        this.soundIDs = [];
        this.sceneActive = false;
        /** Save current state of PIXI Global caches, to prevent unloading global assets */
        this.saveCacheState = function () {
            Object.keys(PIXI.animate.ShapesCache).forEach(function (key) { return _this.globalCache.shapes.push(key); });
            Object.keys(PIXI.utils.TextureCache).forEach(function (key) { return _this.globalCache.textures.push(key); });
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
        }
        for (var id in this.cache.animations) {
            if (!this.globalCache.animations.includes(id)) {
                if (this.cache.animations[id]) {
                    this.cache.animations[id].destroy();
                    delete this.cache.animations[id];
                }
            }
        }
        for (var id in PIXI.utils.TextureCache) {
            if (!this.globalCache.textures.includes(id)) {
                PIXI.utils.TextureCache[id].destroy(true);
                delete this.cache.images[id];
            }
        }
        for (var id in PIXI.animate.ShapesCache) {
            if (!this.globalCache.shapes.includes(id)) {
                PIXI.animate.ShapesCache.remove(id);
            }
        }
        for (var i = this.soundIDs.length - 1; i >= 0; i--) {
            var id = this.soundIDs[i];
            if (!this.globalCache.sounds.includes(id)) {
                this.soundManager.removeSound(id);
                this.soundIDs.splice(i, 1);
            }
        }
        for (var id in PIXI.loader.resources) {
            console.warn('unmanaged resource detected: ', id, PIXI.loader.resources[id]);
        }
        this.sceneActive = false;
    };
    /**
     * load assets for a PixiAnimate stage
     * @param {AnimateStageDescriptor} animateStageDescriptor
     */
    AssetManager.prototype.loadAnimate = function (animateStageDescriptor) {
        var _this = this;
        return new Promise(function (resolve) {
            PIXI.animate.load(animateStageDescriptor.stage, function (movieClip) {
                if (animateStageDescriptor.cacheInstance) {
                    _this.cache.animations[animateStageDescriptor.id] = movieClip;
                }
                if (animateStageDescriptor.isGlobal) {
                    _this.globalCache.animations.push(animateStageDescriptor.id);
                }
                resolve();
            });
        });
    };
    /**
     * Load list of individual image files to PIXI Textures
     * @param {ImageDescriptor[]} assets Array of imnages assets to load
     */
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
            _this.soundManager.addSound(PIXI.sound.add(soundDescriptor.id, soundOptions), soundDescriptor);
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
        return new Promise(function (resolve) {
            var request = new XMLHttpRequest();
            request.open('GET', dataDescriptor.path);
            request.onreadystatechange = function () {
                if ((request.status === 200) && (request.readyState === 4)) {
                    _this.cache.data[dataDescriptor.id] = JSON.parse(request.responseText);
                    if (dataDescriptor.isGlobal) {
                        _this.globalCache.data.push(dataDescriptor.id);
                    }
                    resolve();
                }
            };
            request.send();
        });
    };
    /**
     * Load JSON file containing an AssetList
     * @param {ManifestDescriptor} manifestDescriptor
     */
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

var TRANSITION_ID = 'wgbhSpringRollGameTransition';
/**
 * Manages rendering and transitioning between Scenes
 */
var StageManager = /** @class */ (function () {
    function StageManager(game, containerID, width, height, altWidth) {
        var _this = this;
        this.transitioning = true;
        this.isPaused = false;
        /** Map of Scenes by Scene IDs */
        this.scenes = {};
        this.tweens = [];
        this.timers = [];
        /**
         * Transition to specified scene
         * @param {string} sceneID ID of Scene to transition to
         */
        this.changeScene = function (newScene) {
            var NewScene = _this.scenes[newScene];
            if (!NewScene) {
                throw new Error("No Scene found with ID \"" + newScene + "\"");
            }
            var oldScene = _this._currentScene;
            _this.transitioning = true;
            Promise.resolve()
                .then(function () {
                _this.pixi.stage.addChild(_this.transition);
                _this.transition.stop();
                if (oldScene) {
                    return new Promise(function (resolve) {
                        PIXI.animate.Animator.play(_this.transition, 'cover', resolve);
                    });
                }
            })
                .then(function () {
                PIXI.animate.Animator.play(_this.transition, 'load');
                if (oldScene) {
                    _this.pixi.stage.removeChild(oldScene);
                    oldScene.cleanup();
                    oldScene.destroy({ children: true });
                }
                _this.game.assetManager.unloadAssets();
            })
                .then(function () {
                _this._currentScene = new NewScene(_this.game);
                return new Promise(function (resolve) {
                    _this.game.assetManager.loadAssets(_this._currentScene.preload(), resolve);
                });
            })
                .then(function () {
                _this._currentScene.setup();
                _this.pixi.stage.addChildAt(_this._currentScene, 0);
                return new Promise(function (resolve) {
                    PIXI.animate.Animator.play(_this.transition, 'reveal', resolve);
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
        this.width = width;
        this.height = height;
        this.offset = new PIXI.Point(0, 0);
        this.pixi = new PIXI.Application({ width: width, height: height, antialias: true });
        this.pixi.view.style.display = 'block';
        document.getElementById(containerID).appendChild(this.pixi.view);
        var baseSize = { width: width, height: height };
        this.leftEdge = 0;
        this.rightEdge = width;
        altWidth = altWidth || width;
        var altSize = { width: altWidth, height: height };
        var scale = {
            origin: baseSize,
            min: (altWidth > width) ? baseSize : altSize,
            max: (altWidth > width) ? altSize : baseSize
        };
        this.setScaling(scale);
        this.pixi.ticker.add(this.update.bind(this));
        this.scaleManager = new ScaleManager(this.gotResize);
        console.log(this.scaleManager); // just to quiet the errors... what else should be done with scalemanager instance?
    }
    StageManager.prototype.addScene = function (id, scene) {
        this.scenes[id] = scene;
    };
    StageManager.prototype.addScenes = function (sceneMap) {
        for (var id in sceneMap) {
            this.scenes[id] = sceneMap[id];
        }
    };
    StageManager.prototype.setTransition = function (stage, callback) {
        var _this = this;
        this.game.assetManager.loadAssets([
            { type: 'animate', stage: stage, id: TRANSITION_ID, isGlobal: true, cacheInstance: true }
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
                pause ? this.pixi.ticker.stop() : this.pixi.ticker.start();
            }
        },
        enumerable: true,
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
            this._originSize = this.getSize(scaleconfig.origin.width, scaleconfig.origin.height);
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
        var offset = 0;
        //let scale;
        var calcwidth = this._minSize.width;
        if (aspect > this._maxSize.ratio) {
            // locked in at max (2:1)
            this.scale = this._minSize.ratio / this._maxSize.ratio;
            calcwidth = this._maxSize.width;
            // these styles could - probably should - be replaced by media queries in CSS
            this.pixi.view.style.height = '100vh';
            this.pixi.view.style.width = parseInt((this._maxSize.ratio * 100).toString()) + 'vh';
            this.pixi.view.style.margin = '0 auto';
        }
        else if (aspect < this._minSize.ratio) {
            this.scale = 1;
            this.pixi.view.style.height = parseInt((100 / this._minSize.ratio).toString()) + 'vw';
            this.pixi.view.style.width = '100vw';
            this.pixi.view.style.margin = 'calc((100vh - ' + (100 / this._minSize.ratio).toString() + 'vw)/2) 0';
        }
        else {
            // between min and max ratio (wider than min)
            this.scale = this._minSize.ratio / aspect;
            calcwidth = this._minSize.width / this.scale; // how much wider is this?
            this.pixi.view.style.height = '100vh';
            this.pixi.view.style.width = '100vw';
            this.pixi.view.style.margin = '0';
        }
        offset = (calcwidth - this._originSize.width) * 0.5; // offset assumes that the upper left on MIN is 0,0 
        this.pixi.stage.position.x = offset;
        this.pixi.renderer.resize(calcwidth, this._minSize.height);
        this.offset.x = offset;
        if (this._currentScene) {
            this._currentScene.resize(calcwidth, this._minSize.height, this.offset);
        }
        this.leftEdge = offset * -1;
        this.rightEdge = calcwidth - offset;
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
    StageManager.prototype.addTween = function (tween) {
        this.tweens.push(tween);
    };
    StageManager.prototype.clearTweens = function () {
        this.tweens.forEach(function (tween) {
            tween.destroy(false);
        });
        this.tweens = [];
    };
    StageManager.prototype.addTimer = function (timer) {
        this.timers.push(timer);
    };
    StageManager.prototype.clearTimers = function () {
        this.timers.forEach(function (timer) {
            timer.destroy(false);
        });
        this.timers = [];
    };
    StageManager.prototype.update = function () {
        // if the game is paused, or there isn't a scene, we can skip rendering/updates  
        if (this.transitioning || this.isPaused || !this._currentScene) {
            return;
        }
        var elapsed = PIXI.ticker.shared.elapsedMS;
        if (this.tweens.length) {
            for (var i = this.tweens.length - 1; i >= 0; i--) {
                if (this.tweens[i].active) {
                    this.tweens[i].update(elapsed);
                }
                if (!this.tweens[i].active) {
                    this.tweens.splice(i, 1);
                }
            }
        }
        if (this.timers.length) {
            for (var i = this.timers.length - 1; i >= 0; i--) {
                if (this.timers[i].active) {
                    this.timers[i].update(elapsed);
                }
                if (!this.timers[i].active) {
                    this.timers.splice(i, 1);
                }
            }
        }
        this._currentScene.update(elapsed);
    };
    return StageManager;
}());

var SoundContext = /** @class */ (function () {
    function SoundContext() {
        /** Map of Sounds by ID */
        this.sounds = {};
        /** Map of individual Sound volumes by ID */
        this.volumes = {};
        this._globalVolume = 1;
        this._volume = 1;
    }
    Object.defineProperty(SoundContext.prototype, "volume", {
        /** Context-specific volume */
        set: function (volume) {
            this._volume = volume;
            for (var key in this.sounds) {
                this.applyVolume(key);
            }
        },
        enumerable: true,
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
        enumerable: true,
        configurable: true
    });
    /**
     *
     * @param {PIXI.sound.Sound} sound Sound instance to add
     * @param {string} id ID of sound to add
     * @param {number} volume Number 0-1 of volume for this sound
     */
    SoundContext.prototype.addSound = function (sound, id, volume) {
        if (volume === void 0) { volume = 1; }
        if (this.sounds[id]) {
            console.error('Sound already added with id: ', id);
        }
        this.sounds[id] = sound;
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
     * Destroy sound, remove from context and PIXI Sound cache
     * @param id ID of sound to remove
     */
    SoundContext.prototype.removeSound = function (id) {
        PIXI.sound.remove(id);
        delete this.sounds[id];
        delete this.volumes[id];
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
        this.vo = new SoundContext();
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SoundManager.prototype, "sfxVolume", {
        /** Volume of all sounds in SFX context */
        set: function (volume) {
            this.sfx.volume = volume;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SoundManager.prototype, "voVolume", {
        /** Volume of all sounds in VO context */
        set: function (volume) {
            this.vo.volume = volume;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SoundManager.prototype, "musicVolume", {
        /** Volume of all sounds in Music context */
        set: function (volume) {
            this.music.volume = volume;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Add sound to a SoundManager Context
     * @param {Sound} sound Sound instance to add
     * @param {SoundDescriptor} descriptor Asset load metadata for Sound
     */
    SoundManager.prototype.addSound = function (sound, descriptor) {
        var context = this[descriptor.context || 'sfx'];
        this.soundMeta[descriptor.id] = context;
        context.addSound(sound, descriptor.id, descriptor.volume);
    };
    /**
     * Play sound by ID
     * @param {string} soundID ID of Sound to play
     * @param {PIXI.sound.CompleteCallback} [onComplete] Called when Sound is finished playing
     * @returns {PIXI.sound.IMediaInstance | Promise<PIXI.sound.IMediaInstance>} instace of playing sound (or promise of to-be-played sound if not preloaded)
     */
    SoundManager.prototype.play = function (soundID, onComplete) {
        return this.soundMeta[soundID].sounds[soundID].play(onComplete);
    };
    /** Retrieve reference to Sound instance by ID
     * @param {string} soundID ID of sound to retrieve
     * @returns {PIXI.sound.Sound} Sound instance
     */
    SoundManager.prototype.getSound = function (soundID) {
        return this.soundMeta[soundID].sounds[soundID];
    };
    /**
     * Pause specified Sound by ID - if no ID provided, pause all sounds
     * @param {string} [soundID] ID of sound to pause - if undefined, pause all sounds
     */
    SoundManager.prototype.pause = function (soundID) {
        if (!soundID) {
            PIXI.sound.pauseAll();
        }
        else {
            this.soundMeta[soundID].sounds[soundID].resume();
        }
    };
    /**
     * Resume specified Sound by ID - if no ID provided, resume all sounds
     * @param {string} [soundID] ID of sound to resume - if undefined, resume all sounds
     */
    SoundManager.prototype.resume = function (soundID) {
        if (!soundID) {
            PIXI.sound.resumeAll();
        }
        else {
            this.soundMeta[soundID].sounds[soundID].resume();
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
        this.sound = new SoundManager();
        this.assetManager = new AssetManager(this.sound);
        this.cache = this.assetManager.cache;
        this.stageManager = new StageManager(this, options.containerID, options.width, options.height, options.altWidth);
        this.app = new Application(options.springRollConfig);
        this.app.state.soundVolume.subscribe(function (volume) {
            _this.sound.volume = volume;
        });
        this.app.state.musicVolume.subscribe(function (volume) {
            _this.sound.musicVolume = volume;
        });
        this.app.state.sfxVolume.subscribe(function (volume) {
            _this.sound.sfxVolume = volume;
        });
        this.app.state.voVolume.subscribe(function (volume) {
            _this.sound.voVolume = volume;
        });
        this.app.state.pause.subscribe(function (pause) {
            pause ? _this.sound.pause() : _this.sound.resume();
            _this.stageManager.pause = pause;
        });
        this.app.state.ready.subscribe(function () {
            _this.stageManager.setTransition(options.transition, _this.gameReady.bind(_this));
        });
    }
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

var Tween$1 = /** @class */ (function () {
    function Tween$$1(target, values, time, ease) {
        if (ease === void 0) { ease = 'linear'; }
        var _this = this;
        this.active = true;
        this.currentTime = 0;
        this.initialValues = {};
        this.paused = false;
        this.target = target;
        this.targetValues = values;
        for (var key in this.targetValues) {
            this.initialValues[key] = this.target[key];
        }
        this.totalTime = time;
        var Eases = eases;
        this.ease = Eases[ease];
        if (!this.ease) {
            console.error("No ease found with name " + ease);
            this.ease = Eases.linear;
        }
        this.promise = new Promise(function (resolve, reject) {
            _this.resolve = resolve;
            _this.reject = reject;
        });
    }
    Tween$$1.prototype.pause = function (pause) {
        this.paused = pause;
    };
    Tween$$1.prototype.update = function (deltaTime) {
        if (this.paused) {
            return;
        }
        this.currentTime += deltaTime;
        var time = this.currentTime / this.totalTime > 1 ? 1 : this.currentTime / this.totalTime;
        for (var key in this.targetValues) {
            this.target[key] = this.initialValues[key] + this.ease(time) * (this.targetValues[key] - this.initialValues[key]);
        }
        if (time >= 1) {
            this.destroy(true);
        }
    };
    Tween$$1.prototype.destroy = function (isComplete) {
        if (isComplete === void 0) { isComplete = false; }
        isComplete ? this.resolve() : this.reject();
        this.promise = null;
        this.resolve = null;
        this.reject = null;
        this.active = null;
        this.target = null;
        this.targetValues = null;
        this.totalTime = null;
        this.ease = null;
    };
    return Tween$$1;
}());

var PauseableTimer = /** @class */ (function () {
    function PauseableTimer(callback, time, loop) {
        var _this = this;
        this.active = true;
        this.paused = true;
        this.repeat = false;
        this.targetTime = time;
        this.currentTime = 0;
        this.onComplete = callback;
        this.repeat = loop;
        this.promise = new Promise(function (resolve, reject) {
            _this.resolve = resolve;
            _this.reject = reject;
        });
    }
    PauseableTimer.prototype.pause = function (pause) {
        this.paused = pause;
    };
    PauseableTimer.prototype.reset = function (deltaTime) {
        // deltaTime shows how far over the end we went = do we care?
        this.currentTime = deltaTime ? deltaTime : 0;
    };
    PauseableTimer.prototype.update = function (deltaTime) {
        if (this.paused) {
            return;
        }
        this.currentTime += deltaTime;
        var time = this.currentTime / this.targetTime > 1 ? 1 : this.currentTime / this.targetTime;
        if (time >= 1) {
            if (this.onComplete) {
                this.onComplete();
            }
            if (this.repeat) {
                var delta = this.currentTime - this.targetTime;
                this.reset(delta);
            }
            else {
                this.destroy(true);
            }
        }
    };
    PauseableTimer.prototype.destroy = function (isComplete) {
        if (isComplete === void 0) { isComplete = false; }
        isComplete ? this.resolve() : this.reject('destroyed');
        this.promise = null;
        this.resolve = null;
        this.reject = null;
        this.targetTime = null;
    };
    return PauseableTimer;
}());

/**
 * Generic Scene base class, parent container for all art and functionality in a given scene
 */
var Scene = /** @class */ (function (_super) {
    __extends(Scene, _super);
    function Scene(game) {
        var _this = _super.call(this) || this;
        _this.assetManager = game.assetManager;
        _this.cache = _this.assetManager.cache;
        _this.sound = game.sound;
        _this.stageManager = game.stageManager;
        _this.dataStore = game.dataStore;
        return _this;
    }
    /**
     * provide list of assets to preload
     * @returns {AssetList}
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
        var tween = new Tween$1(target, values, time, ease);
        this.stageManager.addTween(tween);
        return tween;
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
        var timer = new PauseableTimer(callback, time);
        this.stageManager.addTimer(timer);
        return timer;
    };
    Scene.prototype.clearTimeout = function (timer) {
        timer.destroy(false); // destroy without triggering the callback function
    };
    Scene.prototype.setInterval = function (callback, time) {
        var timer = new PauseableTimer(callback, time, true);
        this.stageManager.addTimer(timer);
        return timer;
    };
    Scene.prototype.clearInterval = function (timer) {
        timer.destroy(false); // destroy without triggering the callback function
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
}(PIXI.Container));

var TweenJS = /** @class */ (function (_super) {
    __extends(TweenJS, _super);
    function TweenJS() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return TweenJS;
}(Tween));
Tween._inited = true;
var EaseJS = /** @class */ (function (_super) {
    __extends(EaseJS, _super);
    function EaseJS() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return EaseJS;
}(Ease));

/// <reference types="pixi-animate" />

export { Game, Scene, StageManager, AssetManager, SoundManager, SoundContext, PauseableTimer, Tween$1 as Tween, TweenJS, EaseJS };
//# sourceMappingURL=gamelib.js.map
