# Tweens
The Tween class is integrated into the main game ticker so all tweens will be paused at the same time as the rest of the game.

The API mimics commonly-used functions of CreateJS's TweenJS for easy porting.
example usage:
`Tween.get(someMC, {override:true}).to({x:500, y:200}, 1000, 'QuadInOut').wait(250).call(callback);`
