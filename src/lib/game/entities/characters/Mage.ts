// Ranged spellcaster with moderate HP and projectile speed
import { Character, type CharacterStats } from './Character.js';

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
    projectileSpeed: 50,
    projectileDamage: 25,
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
