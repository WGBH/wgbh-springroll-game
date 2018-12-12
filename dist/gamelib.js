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

/// <reference types="pixi-animate" />

export { Game, Scene, StageManager };
//# sourceMappingURL=gamelib.js.map
