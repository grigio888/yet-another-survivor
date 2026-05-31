// Starter survivor — short range, sturdy, faster on foot
import { Character, type CharacterStats } from './Character.js';
import type { EntitySpriteConfig } from '../../animation/spriteConfig.js';
import type { SpriteFrame } from '../../animation/spriteFrame.js';

import idleNe from '$lib/assets/peasant/female/idle_ne.png';
import idleNw from '$lib/assets/peasant/female/idle_nw.png';
import idleSe from '$lib/assets/peasant/female/idle_se.png';
import idleSw from '$lib/assets/peasant/female/idle_sw.png';

const PEASANT_IDLE_NE_FRAMES = [{ src: idleNe, x: 0, y: 0, zoom: 0.85 }] as const satisfies readonly SpriteFrame[];
const PEASANT_IDLE_NW_FRAMES = [{ src: idleNw, x: 0, y: 0, zoom: 0.85 }] as const satisfies readonly SpriteFrame[];
const PEASANT_IDLE_SE_FRAMES = [{ src: idleSe, x: 0, y: 0, zoom: 0.85 }] as const satisfies readonly SpriteFrame[];
const PEASANT_IDLE_SW_FRAMES = [{ src: idleSw, x: 0, y: 0, zoom: 0.85 }] as const satisfies readonly SpriteFrame[];

export const PEASANT_SPRITE = {
    layout: {
        heightScale: 4.0,
        zoom: 0.85,
        position: { x: 0, y: 0 },
    },
    idle: {
        ne: PEASANT_IDLE_NE_FRAMES[0],
        nw: PEASANT_IDLE_NW_FRAMES[0],
        se: PEASANT_IDLE_SE_FRAMES[0],
        sw: PEASANT_IDLE_SW_FRAMES[0],
    },
    animations: {
        idle: {
            frames: {
                ne: PEASANT_IDLE_NE_FRAMES,
                nw: PEASANT_IDLE_NW_FRAMES,
                se: PEASANT_IDLE_SE_FRAMES,
                sw: PEASANT_IDLE_SW_FRAMES,
            },
            fps: 4,
            loop: true,
        },
        walking: {
            frames: {
                ne: PEASANT_IDLE_NE_FRAMES,
                nw: PEASANT_IDLE_NW_FRAMES,
                se: PEASANT_IDLE_SE_FRAMES,
                sw: PEASANT_IDLE_SW_FRAMES,
            },
            fps: 8,
            loop: true,
        },
        attacking: {
            frames: {
                ne: PEASANT_IDLE_NE_FRAMES,
                nw: PEASANT_IDLE_NW_FRAMES,
                se: PEASANT_IDLE_SE_FRAMES,
                sw: PEASANT_IDLE_SW_FRAMES,
            },
            fps: 12,
            loop: false,
        },
        hit: {
            frames: {
                ne: PEASANT_IDLE_NE_FRAMES,
                nw: PEASANT_IDLE_NW_FRAMES,
                se: PEASANT_IDLE_SE_FRAMES,
                sw: PEASANT_IDLE_SW_FRAMES,
            },
            fps: 10,
            loop: false,
        },
        dying: {
            frames: {
                ne: PEASANT_IDLE_NE_FRAMES,
                nw: PEASANT_IDLE_NW_FRAMES,
                se: PEASANT_IDLE_SE_FRAMES,
                sw: PEASANT_IDLE_SW_FRAMES,
            },
            fps: 8,
            loop: false,
        },
    },
} as const satisfies EntitySpriteConfig;

export const PEASANT_STATS = {
    type: 'peasant',
    maxLives: 4,
    maxHp: 80,
    size: 22,
    color: '#ca8a04',
    speed: 180,
    invincibleFrames: 1000,
    shadow: { anchor: { x: 50, y: 50 }, size: { x: 22, y: 11 } },
    hitbox: { x: 44, y: 44 },
    startingItems: ['fireball'],
    sprite: PEASANT_SPRITE,
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
