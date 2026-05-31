// Ranged spellcaster with moderate HP and projectile speed
import { Character, type CharacterStats } from './Character.js';
import type { EntitySpriteConfig } from '../../animation/spriteConfig.js';
import type { SpriteFrame } from '../../animation/spriteFrame.js';

import idleNe from '$lib/assets/mage/female/idle_ne.png';
import idleNw from '$lib/assets/mage/female/idle_nw.png';
import idleSe from '$lib/assets/mage/female/idle_se.png';
import idleSw from '$lib/assets/mage/female/idle_sw.png';

const MAGE_IDLE_NE_FRAMES = [{ src: idleNe, x: 0, y: 0, zoom: 1 }] as const satisfies readonly SpriteFrame[];
const MAGE_IDLE_NW_FRAMES = [{ src: idleNw, x: 0, y: 0, zoom: 1 }] as const satisfies readonly SpriteFrame[];
const MAGE_IDLE_SE_FRAMES = [{ src: idleSe, x: 0, y: 0, zoom: 1 }] as const satisfies readonly SpriteFrame[];
const MAGE_IDLE_SW_FRAMES = [{ src: idleSw, x: 0, y: 0, zoom: 1 }] as const satisfies readonly SpriteFrame[];

export const MAGE_SPRITE = {
    layout: {
        heightScale: 4.2,
        zoom: 1.25,
        position: { x: 0, y: 10 },
    },
    idle: {
        ne: MAGE_IDLE_NE_FRAMES[0],
        nw: MAGE_IDLE_NW_FRAMES[0],
        se: MAGE_IDLE_SE_FRAMES[0],
        sw: MAGE_IDLE_SW_FRAMES[0],
    },
    animations: {
        idle: {
            frames: {
                ne: MAGE_IDLE_NE_FRAMES,
                nw: MAGE_IDLE_NW_FRAMES,
                se: MAGE_IDLE_SE_FRAMES,
                sw: MAGE_IDLE_SW_FRAMES,
            },
            fps: 4,
            loop: true,
        },
        walking: {
            frames: {
                ne: MAGE_IDLE_NE_FRAMES,
                nw: MAGE_IDLE_NW_FRAMES,
                se: MAGE_IDLE_SE_FRAMES,
                sw: MAGE_IDLE_SW_FRAMES,
            },
            fps: 8,
            loop: true,
        },
        attacking: {
            frames: {
                ne: MAGE_IDLE_NE_FRAMES,
                nw: MAGE_IDLE_NW_FRAMES,
                se: MAGE_IDLE_SE_FRAMES,
                sw: MAGE_IDLE_SW_FRAMES,
            },
            fps: 12,
            loop: false,
        },
        hit: {
            frames: {
                ne: MAGE_IDLE_NE_FRAMES,
                nw: MAGE_IDLE_NW_FRAMES,
                se: MAGE_IDLE_SE_FRAMES,
                sw: MAGE_IDLE_SW_FRAMES,
            },
            fps: 10,
            loop: false,
        },
        dying: {
            frames: {
                ne: MAGE_IDLE_NE_FRAMES,
                nw: MAGE_IDLE_NW_FRAMES,
                se: MAGE_IDLE_SE_FRAMES,
                sw: MAGE_IDLE_SW_FRAMES,
            },
            fps: 8,
            loop: false,
        },
    },
} as const satisfies EntitySpriteConfig;

export const MAGE_STATS = {
    type: 'mage',
    maxLives: 3,
    maxHp: 70,
    size: 15,
    color: '#60a5fa',
    speed: 160,
    invincibleFrames: 1000,
    shadow: {
        anchor: { x: 50, y: 20 },
        size: { x: 35, y: 20 },
    },
    hitbox: { x: 35, y: 30, offset: { x: 0, y: 15 } },
    startingItems: ['fireball'],
    sprite: MAGE_SPRITE,
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
