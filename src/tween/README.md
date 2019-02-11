# Tweens
There are two different types of Tween: **Tween** and **CJSTween**.

## Tween
Tween is a simple Tween, chainable via Promises.

## CJSTween
CJSTween is a bridge to [CreateJS/TweenJS](https://www.createjs.com/docs/tweenjs/modules/TweenJS.html) Tweens, so you can use it in similar ways. In order to use CJSTween, you need to source `@createjs/tweenjs` (and `@types/tween.js` in your game's package.json and you'll to build it out with babel in your webpack.config because there are some ES6 errors in the default dist versions (at least the 2.0.0-beta.4 version of tweenjs, which is the npm-friendly version I could find).

The main addition in CJSTween is that it connects to the **GameTime** tick rather than the createjs.Ticker. You can also disconnect it from **GameTime** and use tick() directly.

The `createjs_tween_type.d.ts` file for typings in this src directory is necessary because it exposes the otherwise private static property `Tween._inited`, which has to be set to true in order to disconnect from createjs.Ticker and call tick() directly.
