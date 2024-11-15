import * as SpringRoll from 'springroll';
import { Property, ScaleManager, CaptionPlayer } from 'springroll';
import * as animate from '@pixi/animate';
import { load, Animator } from '@pixi/animate';
import { utils, Assets, Container } from 'pixi.js';
import { sound } from '@pixi/sound';
import { Application } from '@pixi/app';
import { Point } from '@pixi/math';
import { Ticker } from '@pixi/ticker';

/**
 * Manages loading, caching, and unloading of assets
 */
class AssetManager {
    constructor(soundManager) {
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
        this.saveCacheState = () => {
            Object.keys(utils.TextureCache).forEach((key) => {
                if (!this.globalCache.textures.includes(key)) {
                    this.globalCache.textures.push(key);
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
    loadAssets(assetList, callback) {
        if (!assetList || !assetList.length) {
            return callback();
        }
        let manifests = [];
        for (let asset of assetList) {
            if (asset.type === 'manifest') {
                manifests.push(asset);
            }
        }
        if (manifests.length) {
            const loads = [];
            for (let i = 0; i < manifests.length; i++) {
                loads.push(this.loadManifest(manifests[i]));
            }
            Promise.all(loads).then((results) => {
                //Merge manifests with asset list
                let newList = assetList.slice();
                for (let i = newList.length - 1; i >= 0; i--) {
                    if (newList[i].type === 'manifest') {
                        newList.splice(i, 1);
                    }
                }
                for (let result of results) {
                    newList = newList.concat(result);
                }
                this.loadAssets(newList, callback);
            });
            return;
        }
        const localList = [];
        const globalList = [];
        for (let asset of assetList) {
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
            .then(() => this.executeLoads(globalList))
            .then(() => this.saveCacheState())
            .then(() => this.executeLoads(localList))
            .then(() => { callback(); });
    }
    /** custom handling for loading different types of assets */
    executeLoads(assetList) {
        return new Promise((resolve) => {
            const loads = [];
            const imageAssets = [];
            for (let asset of assetList) {
                switch (asset.type) {
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
            if (imageAssets.length) {
                loads.push(this.loadImages(imageAssets));
            }
            Promise.all(loads).then(resolve);
        });
    }
    /**
     * unload assets loaded via loadAssets
     * @param {boolean} [includeGlobal = false]  should global caches be cleared?
     */
    unloadAssets(includeGlobal = false) {
        if (includeGlobal) {
            this.globalCache.animations.length = 0;
            this.globalCache.data.length = 0;
            this.globalCache.sounds.length = 0;
            this.globalCache.shapes.length = 0;
            this.globalCache.textures.length = 0;
            this.globalCache.spritesheets.length = 0;
        }
        for (let id in this.cache.animations) {
            if (!this.globalCache.animations.includes(id)) {
                if (this.cache.animations[id]) {
                    this.cache.animations[id].destroy();
                    delete this.cache.animations[id];
                }
            }
        }
        for (let id in this.cache.animateAssets) {
            if (!this.globalCache.animations.includes(id)) {
                for (let key in this.cache.animateAssets[id].shapes) {
                    delete this.cache.animateAssets[id].shapes[key];
                }
                for (let key in this.cache.animateAssets[id].textures) {
                    this.cache.animateAssets[id].textures[key].destroy(true);
                    delete this.cache.animateAssets[id].textures[key];
                }
                for (let spritesheet of this.cache.animateAssets[id].spritesheets) {
                    spritesheet.destroy(true);
                }
                this.cache.animateAssets[id].spritesheets.length = 0;
                delete this.cache.animateAssets[id];
            }
        }
        for (let id in this.cache.spritesheets) {
            if (!this.globalCache.spritesheets.includes(id)) {
                for (let key of Object.keys(this.cache.spritesheets[id].textures)) {
                    this.cache.spritesheets[id].textures[key].destroy(true);
                }
                for (let key of Object.keys(this.cache.spritesheets[id].animations)) {
                    for (let texture of this.cache.spritesheets[id].animations[key]) {
                        texture.destroy(true);
                    }
                }
                this.cache.spritesheets[id].destroy(true);
                delete this.cache.spritesheets[id];
            }
        }
        for (let id in utils.TextureCache) {
            if (!this.globalCache.textures.includes(id)) {
                utils.TextureCache[id].destroy(true);
                delete this.cache.images[id];
            }
        }
        for (let i = this.soundIDs.length - 1; i >= 0; i--) {
            let id = this.soundIDs[i];
            if (!this.globalCache.sounds.includes(id)) {
                this.soundManager.removeSound(id);
                this.soundIDs.splice(i, 1);
            }
        }
        this.sceneActive = false;
    }
    /**
     * load assets for a PixiAnimate stage
     * @param {AnimateAssetDescriptor} animateAssetDescriptor
     */
    loadAnimate(animateAssetDescriptor) {
        return new Promise((resolve) => {
            animateAssetDescriptor.asset.setup(animate);
            load(animateAssetDescriptor.asset, {
                createInstance: !!animateAssetDescriptor.cacheInstance,
                complete: (movieClip) => {
                    if (animateAssetDescriptor.cacheInstance) {
                        this.cache.animations[animateAssetDescriptor.id] = movieClip;
                    }
                    if (animateAssetDescriptor.isGlobal) {
                        this.globalCache.animations.push(animateAssetDescriptor.id);
                    }
                    this.cache.animateAssets[animateAssetDescriptor.id] = animateAssetDescriptor.asset;
                    resolve();
                }
            });
        });
    }
    /**
     * Load list of individual image files to PIXI Textures
     * @param {ImageDescriptor[]} assets Array of imnages assets to load
     */
    loadImages(assets) {
        let assetsToLoad = [];
        for (let asset of assets) {
            assetsToLoad.push({ alias: asset.id, src: asset.path });
        }
        return Assets.load(assetsToLoad).then((records) => {
            console.log('loaded images: ', records);
            for (let key of Object.keys(records)) {
                this.cache.images[key] = records[key];
            }
        });
    }
    /**
     * Load an audio file to PIXI Sound
     * @param {SoundDescriptor} soundDescriptor
     */
    loadSound(soundDescriptor) {
        return new Promise((resolve) => {
            let soundOptions = { url: soundDescriptor.path, preload: soundDescriptor.preload !== false };
            if (soundDescriptor.volume !== undefined && typeof soundDescriptor.volume === 'number') {
                soundOptions.volume = soundDescriptor.volume;
            }
            if (soundOptions.preload) {
                soundOptions.loaded = () => { resolve(); };
            }
            this.soundManager.addSound(sound.add(soundDescriptor.id, soundOptions), soundDescriptor);
            this.soundIDs.push(soundDescriptor.id);
            if (soundDescriptor.isGlobal) {
                this.globalCache.sounds.push(soundDescriptor.id);
            }
            if (!soundOptions.preload) {
                resolve();
            }
        });
    }
    /**
     * Load JSON data
     * @param {DataDescriptor} dataDescriptor
     */
    loadData(dataDescriptor) {
        return Assets.load({ alias: dataDescriptor.id, src: dataDescriptor.path }).then((record) => {
            console.log('loaded data: ', record);
            this.cache.data[dataDescriptor.id] = record;
            if (dataDescriptor.isGlobal) {
                this.globalCache.data.push(dataDescriptor.id);
            }
        });
    }
    /**
     * Load Spritesheet data
     * @param {SpritesheetDescriptor} descriptor
     */
    loadSpritesheet(descriptor) {
        return Assets.load({ alias: descriptor.id, src: descriptor.path }).then((record) => {
            console.log('loaded spritesheet: ', record);
            this.cache.spritesheets[descriptor.id] = record;
            if (descriptor.isGlobal) {
                this.globalCache.spritesheets.push(descriptor.id);
            }
        });
    }
    /**
     * Load JSON file containing an AssetList
     * @param {ManifestDescriptor} manifestDescriptor
     */
    loadManifest(manifestDescriptor) {
        return Assets.load(manifestDescriptor.path).then((record) => {
            console.log('loaded manifest: ', record);
            const data = record;
            if (manifestDescriptor.isGlobal) {
                for (let entry of data) {
                    entry.isGlobal = true;
                }
            }
            return data;
        });
    }
}

/**
 *
 *  GameTime is a relay singleton that any object can hook into via its static subscribe() method to get the next tick of the game clock.
 *  Its update() should be called on any live tick of the game; determining whether the tick is live (e.g. checking paused) should happen elsewhere.
 *
 *  Call in the game's main tick/update function, using the static method on the class - GameTime.update(deltaTime);
 *  Subscribe to changes using static method on the class - GameTime.subscribe(callbackfunction)
 *
 */
class GameTime {
    static update(deltaTime) {
        for (let i = 0; i < this.listeners.length; i++) {
            this.listeners[i](deltaTime);
        }
        if (GameTime.gameTick.hasListeners) {
            GameTime.gameTick.value = deltaTime;
        }
    }
    /**
     * Adds an update listener
     * @param {function} callback The listener to call every frame update
     */
    static subscribe(callback) {
        GameTime.listeners.push(callback);
    }
    /**
     * Removes an update listener
     * @param {function} callback The listener to unsubscribe.
     */
    static unsubscribe(callback) {
        GameTime.listeners = GameTime.listeners.filter(listener => listener !== callback);
    }
    static destroy() {
        GameTime.listeners.length = 0;
        GameTime.gameTick.value = null;
    }
}
GameTime.listeners = [];
/**
 * @deprecated use GameTime.subscribe() and GameTime.unsubscribe() directly instead
 */
GameTime.gameTick = new Property(0, true);

class PauseableTimer {
    constructor(callback, time, loop) {
        this.active = true;
        this.paused = false;
        this.repeat = false;
        this.update = (deltaTime) => {
            if (this.paused || !this.targetTime) {
                return;
            }
            this.currentTime += deltaTime;
            const time = this.currentTime / this.targetTime > 1 ? 1 : this.currentTime / this.targetTime;
            if (time >= 1) {
                if (this.onComplete) {
                    this.onComplete();
                }
                if (this.repeat) {
                    const delta = this.currentTime - this.targetTime;
                    this.reset(delta);
                }
                else {
                    this.destroy(true);
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
    static clearTimers() {
        for (let timer of PauseableTimer.timers) {
            timer.destroy(false);
        }
    }
    get promise() {
        if (!this._promise) {
            this._promise = new Promise((resolve, reject) => {
                this.resolve = resolve;
                this.reject = reject;
            });
        }
        return this._promise;
    }
    pause(pause) {
        this.paused = pause;
    }
    reset(deltaTime) {
        // deltaTime shows how far over the end we went = do we care?
        this.currentTime = deltaTime ? deltaTime : 0;
    }
    destroy(isComplete = false) {
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
    }
}
PauseableTimer.timers = [];

const LOADING_DELAY = 250;
/** Devices which are known/expected to flicker if Pixi's `transparent` mode is not enabled */
const FLICKERERS = [
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
const TRANSITION_ID = 'wgbhSpringRollGameTransition';
/**
 * Manages rendering and transitioning between Scenes
 */
class StageManager {
    get scale() {
        console.warn('scale is obsolete, please reference viewFrame for stage size info');
        return 1;
    }
    constructor(game) {
        this.transitioning = true;
        this.isPaused = false;
        /** Map of Scenes by Scene IDs */
        this.scenes = {};
        /**
         * Transition to specified scene
         * @param {string} sceneID ID of Scene to transition to
         */
        this.changeScene = (newScene) => {
            const NewScene = this.scenes[newScene];
            if (!NewScene) {
                throw new Error(`No Scene found with ID "${newScene}"`);
            }
            const oldScene = this._currentScene;
            this.transitioning = true;
            Promise.resolve()
                .then(() => {
                this.pixi.stage.addChild(this.transition);
                this.transition.stop();
                if (oldScene) {
                    return new Promise((resolve) => {
                        Animator.play(this.transition, 'cover', resolve);
                    });
                }
            })
                .then(() => {
                Animator.play(this.transition, 'load');
                if (oldScene) {
                    this.pixi.stage.removeChild(oldScene);
                    oldScene.cleanup();
                    oldScene.destroy({ children: true });
                }
                this.game.assetManager.unloadAssets();
            })
                .then(() => {
                return new Promise((resolve) => {
                    setTimeout(resolve, LOADING_DELAY);
                });
            })
                .then(() => {
                this._currentScene = new NewScene(this.game);
                return this._currentScene.preload();
            })
                .then((assetList) => {
                if (assetList) {
                    return new Promise((resolve) => {
                        this.game.assetManager.loadAssets(assetList, resolve);
                    });
                }
            })
                .then(() => {
                return new Promise((resolve) => {
                    setTimeout(resolve, LOADING_DELAY);
                });
            })
                .then(() => {
                return this._currentScene.setup();
            })
                .then(() => {
                return new Promise((resolve) => {
                    setTimeout(resolve, LOADING_DELAY);
                });
            })
                .then(() => {
                this.pixi.stage.addChildAt(this._currentScene, 0);
            })
                .then(() => {
                return new Promise((resolve) => {
                    setTimeout(resolve, LOADING_DELAY);
                });
            })
                .then(() => {
                return new Promise((resolve) => {
                    Animator.play(this.transition, 'reveal', resolve);
                });
            })
                .then(() => {
                this.transitioning = false;
                this.pixi.stage.removeChild(this.transition);
                this._currentScene.start();
            });
        };
        this.gotResize = (newsize) => {
            this.resize(newsize.width, newsize.height);
        };
        this.game = game;
    }
    createRenderer(containerID, width, height, altWidth, altHeight, playOptions) {
        if (altWidth && altHeight) {
            console.error('responsive scaling system only supports altWidth OR altHeight, using both will produce undesirable results');
        }
        this.width = width;
        this.height = height;
        this.offset = new Point(0, 0);
        // transparent rendering mode is bad for overall performance, but necessary in order
        // to prevent flickering on some Android devices such as Galaxy Tab A and Kindle Fire
        const flickerProne = !!FLICKERERS.find((value) => value.test(navigator.userAgent));
        // Does this version of Safari break antialiasing?
        let badSafari = navigator.userAgent.includes('Safari') && navigator.userAgent.includes('Version/15.4');
        // For Cordova:
        let cordovaWindow = window;
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
        this.pixi = new Application({ width, height, antialias: !badSafari, backgroundAlpha: flickerProne ? 0 : 1 });
        let view = this.pixi.view;
        view.style.display = 'block';
        document.getElementById(containerID).appendChild(view);
        const baseSize = { width: width, height: height };
        altWidth = altWidth || width;
        altHeight = altHeight || height;
        const altSize = { width: altWidth, height: altHeight };
        const altBigger = altWidth > width || altHeight > height;
        const scale = {
            min: altBigger ? baseSize : altSize,
            max: altBigger ? altSize : baseSize
        };
        this.setScaling(scale);
        this.pixi.ticker.add(this.update.bind(this));
        this.scaleManager = new ScaleManager(this.gotResize);
    }
    addCaptions(captionData, renderer) {
        this.captions = new CaptionPlayer(captionData, renderer);
    }
    setCaptionRenderer(renderer) {
        if (this.captions) {
            this.captions.renderer = renderer;
        }
        else {
            console.warn('no captions player exists. call `addCaptions()` or include in GameOptions');
        }
    }
    addScene(id, scene) {
        this.scenes[id] = scene;
    }
    addScenes(sceneMap) {
        for (let id in sceneMap) {
            this.scenes[id] = sceneMap[id];
        }
    }
    setTransition(asset, callback) {
        this.game.assetManager.loadAssets([
            { type: 'animate', asset: asset, id: TRANSITION_ID, isGlobal: true, cacheInstance: true }
        ], () => {
            this.transition = this.game.cache.animations[TRANSITION_ID];
            const curtainLabels = [
                'cover',
                'cover_stop',
                'load',
                'load_loop',
                'reveal',
                'reveal_stop'
            ];
            for (let label of curtainLabels) {
                if (!this.transition.labelsMap.hasOwnProperty(label)) {
                    console.error('Curtain MovieClip missing label: ', label);
                    return;
                }
            }
            this.transition.gotoAndStop('cover');
            callback();
        });
    }
    get captionsMuted() {
        return this.isCaptionsMuted;
    }
    set captionsMuted(muted) {
        this.isCaptionsMuted = muted;
        if (muted && this.captions) {
            this.captions.stop();
        }
    }
    get pause() {
        return this.isPaused;
    }
    set pause(pause) {
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
    }
    getSize(width, height) {
        if (height === 0) {
            return null;
        }
        return {
            width: width,
            height: height,
            ratio: width / height
        };
    }
    setScaling(scaleconfig) {
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
    }
    resize(width, height) {
        const aspect = width / height;
        const wideSize = this._maxSize.width > this._minSize.width ? this._maxSize : this._minSize;
        const tallSize = this._maxSize.height > this._minSize.height ? this._maxSize : this._minSize;
        let calcwidth;
        let calcheight;
        let view = this.pixi.view;
        if (aspect > wideSize.ratio) {
            // locked in at max (2:1)
            calcwidth = wideSize.width;
            calcheight = wideSize.height;
            // these styles could - probably should - be replaced by media queries in CSS
            view.style.height = `${height}px`;
            view.style.width = `${Math.floor(wideSize.ratio * height)}px`;
            view.style.margin = '0 auto';
        }
        else if (aspect < tallSize.ratio) {
            calcwidth = tallSize.width;
            calcheight = tallSize.height;
            let viewHeight = Math.floor(width / tallSize.ratio);
            view.style.height = `${viewHeight}px`;
            view.style.width = `${width}px`;
            view.style.margin = `${Math.floor((height - viewHeight) / 2)}px 0`;
        }
        else {
            // between min and max ratio
            if (wideSize.width !== tallSize.width) {
                let widthDiff = wideSize.width - tallSize.width;
                let aspectDiff = wideSize.ratio - tallSize.ratio;
                let diffRatio = (wideSize.ratio - aspect) / aspectDiff;
                calcwidth = wideSize.width - widthDiff * diffRatio;
                calcheight = wideSize.height;
            }
            else if (tallSize.height !== wideSize.height) {
                let heightDiff = tallSize.height - wideSize.height;
                let aspectDiff = wideSize.ratio - tallSize.ratio;
                let diffRatio = (aspect - tallSize.ratio) / aspectDiff;
                calcheight = tallSize.height - heightDiff * diffRatio;
                calcwidth = tallSize.width;
            }
            else {
                calcheight = tallSize.height;
                calcwidth = wideSize.width;
            }
            view.style.height = `${height}px`;
            view.style.width = `${width}px`;
            view.style.margin = '0';
        }
        let offset = (calcwidth - wideSize.width) * 0.5; // offset assumes that the upper left on MIN is 0,0 and the center is fixed
        let verticalOffset = (calcheight - tallSize.height) * 0.5;
        this.offset.x = offset;
        this.offset.y = verticalOffset;
        this.pixi.stage.position.copyFrom(this.offset);
        const newframe = {
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
    }
    /**
     *
     * globalToScene converts a "global" from PIXI into the scene level, taking into account the offset based on responsive resize
     *
     * @param pointin
     */
    globalToScene(pointin) {
        return { x: pointin.x - this.offset.x, y: pointin.y - this.offset.y };
    }
    addTimer(timer) {
        console.warn('StageManager.prototype.addTimer() is deprecated. PauseableTimers manage themselves');
    }
    clearTimers() {
        console.warn('StageManager.prototype.clearTimers() is deprecated. use PauseableTimer.clearTimers() instead');
        PauseableTimer.clearTimers();
    }
    showCaption(captionid, begin, args) {
        if (this.isCaptionsMuted || !this.captions) {
            return;
        }
        begin = begin || 0;
        this.captions.start(captionid, begin, args);
    }
    stopCaption() {
        if (!this.captions) {
            return;
        }
        this.captions.stop();
    }
    update() {
        // if the game is paused, or there isn't a scene, we can skip rendering/updates  
        if (this.isPaused) {
            return;
        }
        const elapsed = Ticker.shared.elapsedMS;
        if (this.captions) {
            this.captions.update(elapsed / 1000); // captions go by seconds, not ms
        }
        GameTime.update(elapsed);
        if (this.transitioning || !this._currentScene) {
            return;
        }
        this._currentScene.update(elapsed);
    }
}

class SoundContext {
    constructor(issingle) {
        /** Map of Sounds by ID */
        this.sounds = {};
        /** Map of individual Sound volumes by ID */
        this.volumes = {};
        this._globalVolume = 1;
        this._volume = 1;
        this.single = false;
        this.singlePlayComplete = (soundInstance) => {
            this.currentSound = null;
            if (this.singleCallback) {
                const call = this.singleCallback;
                this.singleCallback = null;
                call(soundInstance);
            }
        };
        this.single = (issingle === true);
        this.currentSound = null;
    }
    /** Context-specific volume */
    set volume(volume) {
        this._volume = volume;
        for (let key in this.sounds) {
            this.applyVolume(key);
        }
    }
    /** Volume applied to all contexts */
    set globalVolume(volume) {
        this._globalVolume = volume;
        for (let key in this.sounds) {
            this.applyVolume(key);
        }
    }
    /**
     *
     * @param {pixiSound.Sound} soundInstance Sound instance to add
     * @param {string} id ID of sound to add
     * @param {number} volume Number 0-1 of volume for this sound
     */
    addSound(soundInstance, id, volume = 1) {
        if (this.sounds[id]) {
            console.error('Sound already added with id: ', id);
        }
        this.sounds[id] = soundInstance;
        this.volumes[id] = volume;
        this.applyVolume(id);
    }
    /**
     * Adjust volume of a specific sound by ID
     * @param {string} id ID of sound to set volume on
     * @param {number} volume Number 0-1 to set volume of specified sound
     */
    applyVolume(id, volume) {
        if (volume !== undefined) {
            this.volumes[id] = volume;
        }
        this.sounds[id].volume = this.volumes[id] * this._globalVolume * this._volume;
    }
    /**
     *
     * @param {string} id
     * @param {CompleteCallback} onComplete
     */
    play(id, onComplete) {
        if (this.single) {
            if (this.currentSound) {
                // stop currently playing sound
                this.stop(this.currentSound);
            }
            this.singleCallback = onComplete;
        }
        this.currentSound = id;
        return this.sounds[id].play(this.single ? this.singlePlayComplete : onComplete);
    }
    stop(id) {
        if (id === this.currentSound) {
            this.currentSound = null;
            this.singleCallback = null;
        }
        if (this.sounds[id]) {
            this.sounds[id].stop();
        }
    }
    stopAll() {
        this.currentSound = null;
        for (let key in this.sounds) {
            this.sounds[key].stop();
        }
    }
    /**
     *
     * @param soundid ID of sound to get position of - if none, then find position of most recently played sound
     */
    getPosition(soundid) {
        if (!soundid) {
            soundid = this.currentSound;
        }
        if (!this.sounds[soundid] || !this.sounds[soundid].isPlaying) {
            return -1;
        }
        return this.sounds[soundid].instances[0].progress; // NOTE: There seems to be a Safari bug where the progress listener can become detached from a sound...may need a fallback or workaround
    }
    getPositionSeconds(soundid) {
        if (!soundid) {
            soundid = this.currentSound;
        }
        if (!this.sounds[soundid] || !this.sounds[soundid].isPlaying) {
            return -1;
        }
        return this.sounds[soundid].instances[0].progress * this.sounds[soundid].duration; // NOTE: There seems to be a Safari bug where the progress listener can become detached from a sound...may need a fallback or workaround
    }
    isPlaying() {
        for (let key in this.sounds) {
            if (this.sounds[key].isPlaying) {
                return true;
            }
        }
        return false;
    }
    /**
     * Destroy sound, remove from context and PIXI Sound cache
     * @param id ID of sound to remove
     */
    removeSound(id) {
        sound.remove(id);
        delete this.sounds[id];
        delete this.volumes[id];
        if (id === this.currentSound) {
            this.currentSound = null;
        }
    }
}

/**
 * Manages Sound playback, pausing, resuming, and volume control
 */
class SoundManager {
    constructor() {
        /** Context for managing SFX sounds */
        this.sfx = new SoundContext();
        /** Context for managing VO sounds */
        this.vo = new SoundContext(true);
        /** Context for managing music sounds */
        this.music = new SoundContext();
        /** Mapping of which SoundContexts each Sound belongs to, by ID */
        this.soundMeta = {};
    }
    /** Global volume of all SoundContexts */
    set volume(volume) {
        this.sfx.globalVolume = volume;
        this.vo.globalVolume = volume;
        this.music.globalVolume = volume;
    }
    /** Volume of all sounds in SFX context */
    set sfxVolume(volume) {
        this.sfx.volume = volume;
    }
    /** Volume of all sounds in VO context */
    set voVolume(volume) {
        this.vo.volume = volume;
    }
    /** Volume of all sounds in Music context */
    set musicVolume(volume) {
        this.music.volume = volume;
    }
    /**
     * Add sound to a SoundManager Context
     * @param {Sound} sound Sound instance to add
     * @param {SoundDescriptor} descriptor Asset load metadata for Sound
     */
    addSound(soundInstance, descriptor) {
        const context = this[descriptor.context || 'sfx'];
        this.soundMeta[descriptor.id] = context;
        context.addSound(soundInstance, descriptor.id, descriptor.volume);
    }
    /**
     * Play sound by ID
     * @param {string} soundID ID of Sound to play
     * @param {pixiSound.CompleteCallback} [onComplete] Called when Sound is finished playing
     * @returns {pixiSound.IMediaInstance | Promise<pixiSound.IMediaInstance>} instace of playing sound (or promise of to-be-played sound if not preloaded)
     */
    play(soundID, onComplete) {
        return this.soundMeta[soundID].play(soundID, onComplete);
        // return this.soundMeta[soundID].sounds[soundID].play(onComplete);
    }
    stop(soundID) {
        this.soundMeta[soundID].stop(soundID);
    }
    /** Retrieve reference to Sound instance by ID
     * @param {string} soundID ID of sound to retrieve
     * @returns {pixiSound.Sound} Sound instance
     */
    getSound(soundID) {
        return this.soundMeta[soundID].sounds[soundID];
    }
    /**
     * Retrieve reference to the SoundContext by ID
     *
     * @param soundID ID of sound to look up
     * @returns {SoundContext}
     */
    getContext(soundID) {
        return this.soundMeta[soundID];
    }
    /**
     * Pause specified Sound by ID - if no ID provided, pause all sounds
     * @param {string} [soundID] ID of sound to pause - if undefined, pause all sounds
     */
    pause(soundID) {
        if (!soundID) {
            sound.pauseAll();
        }
        else {
            this.getSound(soundID).pause();
        }
    }
    /**
     * Resume specified Sound by ID - if no ID provided, resume all sounds
     * @param {string} [soundID] ID of sound to resume - if undefined, resume all sounds
     */
    resume(soundID) {
        if (!soundID) {
            sound.resumeAll();
        }
        else {
            this.getSound(soundID).resume();
        }
    }
    /**
     * Adjust volume of a specific sound by ID
     * @param {string} id ID of sound to set volume on
     * @param {number} volume Number 0-1 to set volume of specified sound
     */
    setVolume(id, volume) {
        this.soundMeta[id].applyVolume(id, volume);
    }
    /**
     * Destroy sound, remove from context and PIXI Sound cache
     * @param id ID of sound to remove
     */
    removeSound(id) {
        const context = this.soundMeta[id];
        context.removeSound(id);
        delete this.soundMeta[id];
    }
}

/** Base Class for WGBH SpringRoll Games - extend this Class in your project */
class Game {
    /** Add plugin to this instance of SpringRoll */
    static addPlugin(plugin) {
        SpringRoll.Application.uses(plugin);
    }
    constructor(options) {
        /** object for storing global data - accessible from all Scenes */
        this.dataStore = {};
        this.preloadGlobal = () => {
            const assets = this.preload();
            if (assets && assets.length) {
                for (let asset of assets) {
                    //Game-level assets are always global
                    asset.isGlobal = true;
                }
                this.assetManager.unloadAssets(); //Prep for fresh loading
                this.assetManager.loadAssets(assets, this.gameReady.bind(this));
            }
            else {
                this.gameReady();
            }
        };
        this.sound = new SoundManager();
        this.assetManager = new AssetManager(this.sound);
        this.cache = this.assetManager.cache;
        this.stageManager = new StageManager(this);
        this.app = new SpringRoll.Application(options.springRollConfig);
        // Wait until playOptions received before creating renderer
        // Wait until renderer created before creating transition
        let rendererInitialized = false;
        let applicationReady = false;
        const initializeRenderer = (playOptions) => {
            if (!rendererInitialized) {
                this.stageManager.createRenderer(options.containerID, options.width, options.height, options.altWidth, options.altHeight, playOptions);
                if (applicationReady) {
                    this.stageManager.setTransition(options.transition, this.preloadGlobal);
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
            this.app.state.soundVolume.subscribe((volume) => {
                this.sound.volume = volume;
            });
            if (options.springRollConfig.features.music || options.springRollConfig.features.musicVolume) {
                this.app.state.musicVolume.subscribe((volume) => {
                    this.sound.musicVolume = volume;
                });
            }
            if (options.springRollConfig.features.sfx || options.springRollConfig.features.sfxVolume) {
                this.app.state.sfxVolume.subscribe((volume) => {
                    this.sound.sfxVolume = volume;
                });
            }
            if (options.springRollConfig.features.vo || options.springRollConfig.features.voVolume) {
                this.app.state.voVolume.subscribe((volume) => {
                    this.sound.voVolume = volume;
                });
            }
        }
        this.app.state.pause.subscribe((pause) => {
            if (this.stageManager.pause !== pause) {
                pause ? this.sound.pause() : this.sound.resume();
                this.stageManager.pause = pause;
            }
        });
        if (options.springRollConfig.features.captions) {
            this.app.state.captionsMuted.subscribe((isMuted) => {
                this.stageManager.captionsMuted = isMuted;
            });
        }
        this.app.state.ready.subscribe(() => {
            if (rendererInitialized) {
                this.stageManager.setTransition(options.transition, this.preloadGlobal);
            }
            applicationReady = true;
        });
        if (options.captions && options.captions.config) {
            this.stageManager.addCaptions(options.captions.config, options.captions.display);
        }
    }
    /** overrride and return list of global assets */
    preload() {
        return null;
    }
    /** called when game is ready to enter first scene - override this function and set first scene here */
    gameReady() {
        //override and set first scene in this function
    }
    addScene(id, scene) {
        this.stageManager.addScene(id, scene);
    }
    addScenes(sceneMap) {
        this.stageManager.addScenes(sceneMap);
    }
    /**
     * Transition to specified scene
     * @param {string} sceneID ID of Scene to transition to
     */
    changeScene(sceneID) {
        this.stageManager.changeScene(sceneID);
    }
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

const Eases = eases;
class Tween {
    constructor(target) {
        this.paused = false;
        this.steps = [];
        this.currentStep = 0;
        this.loop = 0;
        this.to = (targetValues, totalTime, ease = 'linear') => {
            this.steps.push({ targetValues, totalTime, ease: Eases[ease] });
            return this;
        };
        this.wait = (totalTime) => {
            this.steps.push({ totalTime });
            return this;
        };
        this.call = (call) => {
            this.steps.push({ call });
            return this;
        };
        this.doComplete = () => {
            if (this.onComplete) {
                this.onComplete();
            }
            if (this._resolve) {
                this._resolve();
            }
            this.destroy();
        };
        this.update = (elapsed) => {
            if (this.paused) {
                return;
            }
            if (this.steps.length <= this.currentStep) {
                if (this.loop) {
                    if (this.loop > 0) {
                        this.loop--;
                    }
                    this.currentStep = 0;
                    for (let step of this.steps) {
                        step.currentTime = 0;
                    }
                }
                else {
                    return this.doComplete();
                }
            }
            const step = this.steps[this.currentStep];
            if (step.call) {
                this.currentStep++;
                return step.call();
            }
            if (!step.currentTime) {
                step.currentTime = 0;
                if (step.targetValues) {
                    step.initialValues = {};
                    for (let key in step.targetValues) {
                        step.initialValues[key] = this.target[key];
                    }
                }
            }
            step.currentTime += elapsed;
            const time = step.currentTime / step.totalTime > 1 ? 1 : step.currentTime / step.totalTime;
            if (step.targetValues) {
                for (let key in step.targetValues) {
                    this.target[key] = step.initialValues[key] + step.ease(time) * (step.targetValues[key] - step.initialValues[key]);
                }
            }
            if (time >= 1) {
                this.currentStep++;
            }
        };
        this.target = target;
    }
    static get(target, options = {}) {
        if (options.override) {
            this.removeTweens(target);
        }
        const tween = new Tween(target);
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
    }
    static removeTweens(target) {
        for (let i = Tween.tweens.length - 1; i >= 0; i--) {
            if (Tween.tweens[i].target === target) {
                Tween.tweens[i].destroy();
            }
        }
    }
    static removeAllTweens() {
        for (let i = Tween.tweens.length - 1; i >= 0; i--) {
            Tween.tweens[i].destroy();
        }
    }
    get promise() {
        if (!this._promise) {
            this._promise = new Promise((resolve) => { this._resolve = resolve; });
        }
        return this._promise;
    }
    destroy() {
        GameTime.unsubscribe(this.update);
        if (Tween.tweens.includes(this)) {
            Tween.tweens.splice(Tween.tweens.indexOf(this), 1);
        }
        this.target = null;
        this.steps = null;
        this.currentStep = null;
        this._promise = null;
        this._resolve = null;
    }
}
Tween.tweens = [];

/**
 * Generic Scene base class, parent container for all art and functionality in a given scene
 */
class Scene extends Container {
    constructor(game) {
        super();
        this.app = game.app;
        this.assetManager = game.assetManager;
        this.cache = this.assetManager.cache;
        this.sound = game.sound;
        this.stageManager = game.stageManager;
        this.dataStore = game.dataStore;
    }
    /**
     * Provide list of assets to preload.
     * Optionally, return a Promise which may return a list of assets to preload.
     * @returns {AssetList | Promise<AssetList>}
     */
    preload() {
        return;
    }
    /**
     * Exit this Scene and transition to specified scene
     * @param {string} sceneID ID of Scene to transition to
     */
    changeScene(sceneID) {
        this.stageManager.changeScene(sceneID);
    }
    /**
     * Prepare initial visual state - called after preload is complete, while scene is obscured by loader.
     * Optionally return a Promise, which will delay removal of the loader until it is resolved.
     * @returns {Promise<any> | void}
     */
    setup() {
        //override this, called to prepare graphics
    }
    /**
     * entrypoint to scene - called after loader transition is complete
     */
    start() {
        //override this - called to start scene
    }
    /**
     * pause scene - override this if you need to pause functionality of your scene
     * when the rendering and sound is paused
     * @param paused whether or not the game is being paused (false if being resumed)
     */
    pause(paused) {
        //override this if you have custom timed functionality that should be paused
        //with the rest of the game
    }
    /**
     * callback for frame ticks
     * @param {number} deltaTime time since last frame in milliseconds.
     */
    update(deltaTime) {
        //override this to get update ticks
    }
    /**
     * Simple tween target's numeric properties to specified values over time with easinbg
     * @param target object with values to tween
     * @param values numeric end values of tweening target, keyed by target property names
     * @param time number of frames over which to tween target values
     * @param [ease] name of easing curve to apply to tween
     * @returns {Tween} instance of Tween, for pausing/cancelling
     */
    tween(target, values, time, ease) {
        console.warn('Scene.tween() is deprecated, please use Tween.get()');
        return Tween.get(target).to(values, time, ease);
    }
    /**
     *
     * Replacement for the window.setTimeout, this timeout will pause when the game is paused.
     * Similar to Tween
     *
     * @param callback
     * @param time
     */
    setTimeout(callback, time) {
        return new PauseableTimer(callback, time);
    }
    clearTimeout(timer) {
        if (timer) {
            timer.destroy(false); // destroy without triggering the callback function
        }
    }
    setInterval(callback, time) {
        return new PauseableTimer(callback, time, true);
    }
    clearInterval(timer) {
        if (timer) {
            timer.destroy(false); // destroy without triggering the callback function
        }
    }
    resize(width, height, offset) {
        // in case something special needs to happen on resize
    }
    /**
     * Called when Scene is about to transition out - override to clean up art or other objects in memory
     * @returns {void} return a Promise to resolve when any asynchronous cleanup is complete
     */
    cleanup() {
        //override this to clean up Scene
    }
}

export { AssetManager, Game, GameTime, PauseableTimer, Scene, SoundContext, SoundManager, StageManager, Tween };
//# sourceMappingURL=gamelib.js.map
