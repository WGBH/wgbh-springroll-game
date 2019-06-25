# WGBH SpringRoll Game Library
Framework for building 2D games using SpringRoll 2 and Pixi.js

## Peer Dependencies
The following modules must be included alongside this one in your project:

### SpringRoll 2
For integration into standard PBS game container

### Pixi.js
2D WebGL renderer with Context2D fallback

### Pixi Sound
WebAudio sound loading/playback system with HTML5 Audio fallback

### PixiAnimate
For loading and playback of content exported from Adobe Animate via the PixiAnimate Extension


## Framework Philosophy
*To reduce the need for an individual SpringRoll game project to address the issues of browser compatibility and container integration, and to provide a structure and set of tools likely to be useful for all SpringRoll games*

This framework is based around a concept of one `Game` being a collection of `Scenes`. A `Game` serves to bind the various integration/management classes and the `Scenes` together. Only one `Scene` is active at a time, and at any given time, the currently active `Scene` is responsible for all interactions, game behavior, display, etc.


## Project Setup
Your project should contain a class which extends this library's `Game` class, and one or more classes which extend this library's `Scene` class. Override the `Game's` `gameReady` function, therein calling `this.addScenes()`, passing in an object mapping the classes of each of your game's `Scene`s to string IDs which will be used to reference them later. Then call `this.changeScene()`, passing in the ID of your initial `Scene`. Instantiate your `Game` class at the root of your source, passing in desired game options, including a `transition` which is a reference to a PixiAnimate stage class for the transition animation, and a `containerID` which matches the ID of the HTML element which should contain your game's Canvas element.


### Scenes
A `Scene` is an extension of `PIXI.Container` and also contains the following functions which should, in most cases, be overridden in your implementation. They are called in sequential order over the course of the `Scene's` active lifecycle:

#### preload():AssetList
This method should return an array of `AssetDescriptor` objects, specifying the types, IDs, and paths for files to be loaded before entering this `Scene`.

#### setup()
This method is called once all assets specified in `preload()` have completed loading. At this time, your `Scene` should create and add any children which should be visible upon transitioning in.

#### start()
This method is called when the transition-in is complete, fully revealing the contents of this `Scene`. Start this `Scene's` behavior sequence here.

#### update(deltaTime:number)
This method is called on each tick of the render loop (target: 60FPS), starting just after `start()` is called. The `deltaTime` value passed in represents the actual time since the previous frame, in milliseconds.

#### changeScene(nextScene:string)
*Do not override this method.* This method should be called to transition out of this `Scene` and into the next. A valid ID for the next scene must be passed in.

#### cleanup()
This method is called at the end of a transition out of this `Scene`. At this time, the transition should be covering the screen, hiding the contents of this `Scene`, unneeded references to objects in memory should be cleaned up, and any children added to the display should be removed in preparation for their assets to be unloaded and this `Scene` to be destroyed.
