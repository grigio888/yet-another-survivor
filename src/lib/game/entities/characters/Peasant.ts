// Starter survivor — short range, sturdy, faster on foot
import { Character, type CharacterStats } from './Character.js';

import idleNe from '$lib/assets/peasant/female/idle_ne.png';
import idleNw from '$lib/assets/peasant/female/idle_nw.png';
import idleSe from '$lib/assets/peasant/female/idle_se.png';
import idleSw from '$lib/assets/peasant/female/idle_sw.png';

export const PEASANT_STATS = {
    type: 'peasant',
    maxLives: 4,
    maxHp: 80,
    size: 22,
    color: '#ca8a04',
    speed: 180,
    invincibleFrames: 1000,
    startingItems: ['fireball'],
    sprite: {
        layout: {
            feetFromBottom: 22,
            heightScale: 4.0,
            zoom: .85,
            liftFromShadowCenter: 0.25,
        },
        idle: {
            ne: idleNe,
            nw: idleNw,
            se: idleSe,
            sw: idleSw,
        },
    },
} as const satisfies CharacterStats;

export class Peasant extends Character {
    constructor(x?: number, y?: number) {
        super({
            x: x ?? 0,
            y: y ?? 0,
            stats: PEASANT_STATS,
        });
    }
}
