// Slow melee blob — animated idle sprites, no directional facings
import { Enemy } from './Enemy.js';
import type { EnemyStats } from './types.js';
import type { EntitySpriteConfig } from '../../animation/spriteConfig.js';
import type { SpriteFrame } from '../../animation/spriteFrame.js';

import idle_sw_1 from '$lib/assets/enemies/jelly/idle_sw_1.png';
import idle_sw_2 from '$lib/assets/enemies/jelly/idle_sw_2.png';
import idle_sw_3 from '$lib/assets/enemies/jelly/idle_sw_3.png';
import idle_sw_4 from '$lib/assets/enemies/jelly/idle_sw_4.png';

import idle_nw_1 from '$lib/assets/enemies/jelly/idle_nw_1.png';
import idle_nw_2 from '$lib/assets/enemies/jelly/idle_nw_2.png';
import idle_nw_3 from '$lib/assets/enemies/jelly/idle_nw_3.png';
import idle_nw_4 from '$lib/assets/enemies/jelly/idle_nw_4.png';

import walk_sw_1 from '$lib/assets/enemies/jelly/walk_sw_1.png';
import walk_sw_2 from '$lib/assets/enemies/jelly/walk_sw_2.png';
import walk_sw_3 from '$lib/assets/enemies/jelly/walk_sw_3.png';
import walk_sw_4 from '$lib/assets/enemies/jelly/walk_sw_4.png';
import walk_sw_5 from '$lib/assets/enemies/jelly/walk_sw_5.png';
import walk_sw_6 from '$lib/assets/enemies/jelly/walk_sw_6.png';
import walk_sw_7 from '$lib/assets/enemies/jelly/walk_sw_7.png';
import walk_sw_8 from '$lib/assets/enemies/jelly/walk_sw_8.png';

import walk_nw_1 from '$lib/assets/enemies/jelly/walk_nw_1.png';
import walk_nw_2 from '$lib/assets/enemies/jelly/walk_nw_2.png';
import walk_nw_3 from '$lib/assets/enemies/jelly/walk_nw_3.png';
import walk_nw_4 from '$lib/assets/enemies/jelly/walk_nw_4.png';
import walk_nw_5 from '$lib/assets/enemies/jelly/walk_nw_5.png';
import walk_nw_6 from '$lib/assets/enemies/jelly/walk_nw_6.png';
import walk_nw_7 from '$lib/assets/enemies/jelly/walk_nw_7.png';
import walk_nw_8 from '$lib/assets/enemies/jelly/walk_nw_8.png';

import hit_sw_1 from '$lib/assets/enemies/jelly/hit_sw_1.png';
import hit_nw_1 from '$lib/assets/enemies/jelly/hit_nw_1.png';

import dying_sw_1 from '$lib/assets/enemies/jelly/dying_sw_1.png';
import dying_sw_2 from '$lib/assets/enemies/jelly/dying_sw_2.png';
import dying_sw_3 from '$lib/assets/enemies/jelly/dying_sw_3.png';
import dying_sw_4 from '$lib/assets/enemies/jelly/dying_sw_4.png';

/** Art authored facing SW — SE mirrors horizontally at draw time. */
const JELLY_IDLE_SW_FRAMES = [
    { src: idle_sw_1, x: 0, y: 0, zoom: 1.05 },
    { src: idle_sw_2, x: 0, y: -2.5, zoom: 1.05 },
    { src: idle_sw_3, x: 0, y: -2.5, zoom: 1.05 },
    { src: idle_sw_4, x: 0, y: 0, zoom: .95 },
] as const satisfies readonly SpriteFrame[];
const JELLY_IDLE_NW_FRAMES = [
    { src: idle_nw_1, x: 0, y: 0, zoom: 1.05 },
    { src: idle_nw_2, x: 0, y: .5, zoom: 1.05 },
    { src: idle_nw_3, x: 0, y: .5, zoom: 1.05 },
    { src: idle_nw_4, x: 0, y: 0, zoom: .95 },
] as const satisfies readonly SpriteFrame[];
const JELLY_WALK_SW_FRAMES = [
    { src: walk_sw_1, x: 0, y: 0, zoom: .9 },
    { src: walk_sw_2, x: 0, y: 0, zoom: .9 },
    { src: walk_sw_3, x: 0, y: 0, zoom: .9 },
    { src: walk_sw_4, x: 0, y: -3, zoom: .95 },
    { src: walk_sw_5, x: 0, y: -6.5, zoom: .95 },
    { src: walk_sw_6, x: 0, y: -9, zoom: .9 },
    { src: walk_sw_7, x: 0, y: -5.5, zoom: .9 },
    { src: walk_sw_8, x: 0, y: -1.5, zoom: .9 },
] as const satisfies readonly SpriteFrame[];
const JELLY_WALK_NW_FRAMES = [
    { src: walk_nw_1, x: 0, y: 0, zoom: .9 },
    { src: walk_nw_2, x: 0, y: 0, zoom: .9 },
    { src: walk_nw_3, x: 0, y: 0, zoom: .9 },
    { src: walk_nw_4, x: 0, y: -3, zoom: .95 },
    { src: walk_nw_5, x: 0, y: -6.5, zoom: .95 },
    { src: walk_nw_6, x: 0, y: -9, zoom: .9 },
    { src: walk_nw_7, x: 0, y: -5.5, zoom: .9 },
    { src: walk_nw_8, x: 0, y: -1.5, zoom: .9 },
] as const satisfies readonly SpriteFrame[];

const JELLY_HIT_SW_FRAMES = [
    { src: hit_sw_1, x: 0, y: 0, zoom: .9 },
] as const satisfies readonly SpriteFrame[];
const JELLY_HIT_NW_FRAMES = [
    { src: hit_nw_1, x: 0, y: 0, zoom: .9 },
] as const satisfies readonly SpriteFrame[];
const JELLY_DYING_SW_FRAMES = [
    { src: dying_sw_1, x: 0, y: 0, zoom: 1.5 },
    { src: dying_sw_2, x: 0, y: 0, zoom: 2 },
    { src: dying_sw_3, x: 0, y: 13, zoom: 2.2 },
    { src: dying_sw_4, x: 0, y: 13, zoom: .95 },
] as const satisfies readonly SpriteFrame[];

export const JELLY_SPRITE = {
    layout: {
        heightScale: 3.5,
        zoom: 1.05,
        position: { x: 0, y: 0 },
    },
    idle: {
        ne: JELLY_IDLE_NW_FRAMES[0],
        nw: JELLY_IDLE_NW_FRAMES[0],
        se: JELLY_IDLE_SW_FRAMES[0],
        sw: JELLY_IDLE_SW_FRAMES[0],
    },
    animations: {
        idle: {
            frames: {
                ne: JELLY_IDLE_NW_FRAMES,
                nw: JELLY_IDLE_NW_FRAMES,
                se: JELLY_IDLE_SW_FRAMES,
                sw: JELLY_IDLE_SW_FRAMES,
            },
            fps: 10,
            loop: true,
        },
        walking: {
            frames: {
                ne: JELLY_WALK_NW_FRAMES,
                nw: JELLY_WALK_NW_FRAMES,
                se: JELLY_WALK_SW_FRAMES,
                sw: JELLY_WALK_SW_FRAMES,
            },
            fps: 12,
            loop: true,
        },
        hit: {
            frames: {
                ne: JELLY_HIT_NW_FRAMES,
                nw: JELLY_HIT_NW_FRAMES,
                se: JELLY_HIT_SW_FRAMES,
                sw: JELLY_HIT_SW_FRAMES,
            },
            fps: 2,
            loop: false,
        },
        dying: {
            frames: {
                ne: JELLY_DYING_SW_FRAMES,
                nw: JELLY_DYING_SW_FRAMES,
                se: JELLY_DYING_SW_FRAMES,
                sw: JELLY_DYING_SW_FRAMES,
            },
            fps: 10,
            loop: false,
        },
    },
    facingFlips: {
        se: { horizontal: true },
        ne: { horizontal: true },
    },
} as const satisfies EntitySpriteConfig;

export const JELLY_STATS = {
    hp: 50,
    speed: 55,
    damage: 1,
    range: 0,
    shootCooldown: 0,
    scoreValue: 12,
    color: '#f472b6', // pink blob
    size: 8,
    shadow: {
        anchor: { x: 50, y: 80 },
        size: { x: 40, y: 25 }
    },
    hitbox: {
        x: 40, y: 25,
        offset: { x: 0, y: 0 }
    },
    stagger: 10,
    staggerTime: 300,
} as const satisfies EnemyStats;

export class Jelly extends Enemy {
    constructor(x?: number, y?: number) {
        super({
            x: x ?? 0,
            y: y ?? 0,
            type: 'jelly',
            size: JELLY_STATS.size,
            hp: JELLY_STATS.hp,
            maxHp: JELLY_STATS.hp,
            speed: JELLY_STATS.speed,
            damage: JELLY_STATS.damage,
            color: JELLY_STATS.color,
            scoreValue: JELLY_STATS.scoreValue,
            stagger: JELLY_STATS.stagger,
            staggerTime: JELLY_STATS.staggerTime,
            hitbox: JELLY_STATS.hitbox,
            shadow: JELLY_STATS.shadow,
            sprite: JELLY_SPRITE,
        });
    }

    update(dt: number, targetX: number, targetY: number): null {
        if (this.isStaggered()) {
            super.update(dt, targetX, targetY);
            this.tickStaggered(dt);
            return null;
        }

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let moved = false;

        if (dist > 0) {
            moved = true;
            this.faceToward(dx, dy);
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }

        super.update(dt, targetX, targetY);
        this.tickAnimator(dt, moved);
        return null;
    }
}
