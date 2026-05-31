// Ranged spellcaster with moderate HP and projectile speed
import { Character, type CharacterStats } from './Character.js';

import idleNe from '$lib/assets/mage/female/idle_ne.png';
import idleNw from '$lib/assets/mage/female/idle_nw.png';
import idleSe from '$lib/assets/mage/female/idle_se.png';
import idleSw from '$lib/assets/mage/female/idle_sw.png';

export const MAGE_STATS = {
    type: 'mage',
    maxLives: 3,
    maxHp: 70,
    size: 20,
    color: '#60a5fa',
    speed: 160,
    shootCooldown: 400,
    range: 150,
    invincibleFrames: 1000,
    projectileSpeed: 75,
    projectileDamage: 25,
    sprite: {
        layout: {
            feetFromBottom: 22,
            heightScale: 4.2,
            zoom: 1.25,
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

export class Mage extends Character {
    constructor(x?: number, y?: number) {
        super({
            x: x ?? 0,
            y: y ?? 0,
            stats: MAGE_STATS,
        });
    }
}
