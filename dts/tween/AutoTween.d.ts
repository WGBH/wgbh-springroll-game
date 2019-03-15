import Tween from './Tween';
import { Ease } from './Tween';
/**
 *
 * This is a Tween that automatically hooks itself to the game ticker
 *
 *
 */
export default class AutoTween extends Tween {
    constructor(target: any, values: any, time: number, ease?: Ease);
    destroy(): void;
    listen(yesorno: boolean): void;
}
