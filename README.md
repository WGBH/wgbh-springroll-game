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


## Basic Setup
Your project should contain a class which extends this library's `Game` class, and one or more classes which extend this library's `Scene` class. In your `Game`'s constructor, set the `scenes` property to a map of instances of each of your game's `Scene`s. Override the `Game`'s `gameReady` function, therein calling `this.changeScene()`, passing in the ID of your initial `Scene`. Instantiate your `Game` class at the root of your source, passing in desired game options, including a `transition` which is a reference to a PixiAnimate stage class for the transition animation, and a `containerID` which matches the ID of the HTML element which should contain your game's Canvas element.

### Scenes
A `Scene` contains the following functions which are intended to be overridden in your implementation. They are called in sequential order over the course of a `Scene`'s active lifecycle:

#### preload()
This method should return an array of `AssetDescriptor` objects, specifying the types, IDs, and paths for files to be loaded before entering this `Scene`.


