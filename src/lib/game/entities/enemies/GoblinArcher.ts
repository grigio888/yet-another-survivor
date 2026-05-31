// Ranged goblin — animated idle/walk sprites, stops to shoot when in range
import { CANVAS } from '../../config/index.js';
import { isInsideShadowEntityView } from '../../systems/arenaBounds.js';
import { Enemy } from './Enemy.js';
import type { EnemyStats } from './types.js';
import type { EntitySpriteConfig } from '../../animation/spriteConfig.js';
import type { SpriteFrame } from '../../animation/spriteFrame.js';
import type { Projectile } from '../../systems/collision.js';

import idle_sw_1 from '$lib/assets/enemies/goblinArcher/idle_sw_1.png';
import idle_sw_2 from '$lib/assets/enemies/goblinArcher/idle_sw_2.png';
import idle_sw_3 from '$lib/assets/enemies/goblinArcher/idle_sw_3.png';
import idle_sw_4 from '$lib/assets/enemies/goblinArcher/idle_sw_4.png';
import idle_sw_5 from '$lib/assets/enemies/goblinArcher/idle_sw_5.png';

import idle_nw_1 from '$lib/assets/enemies/goblinArcher/idle_nw_1.png';
import idle_nw_2 from '$lib/assets/enemies/goblinArcher/idle_nw_2.png';
import idle_nw_3 from '$lib/assets/enemies/goblinArcher/idle_nw_3.png';
import idle_nw_4 from '$lib/assets/enemies/goblinArcher/idle_nw_4.png';

import walk_sw_1 from '$lib/assets/enemies/goblinArcher/walk_sw_1.png';
import walk_sw_2 from '$lib/assets/enemies/goblinArcher/walk_sw_2.png';
import walk_sw_3 from '$lib/assets/enemies/goblinArcher/walk_sw_3.png';
import walk_sw_4 from '$lib/assets/enemies/goblinArcher/walk_sw_4.png';
import walk_sw_5 from '$lib/assets/enemies/goblinArcher/walk_sw_5.png';
import walk_sw_6 from '$lib/assets/enemies/goblinArcher/walk_sw_6.png';
import walk_sw_7 from '$lib/assets/enemies/goblinArcher/walk_sw_7.png';
import walk_sw_8 from '$lib/assets/enemies/goblinArcher/walk_sw_8.png';

/** Art authored facing SW — SE/NE mirror horizontally at draw time. */
const GOBLIN_IDLE_SW_FRAMES = [
    { src: idle_sw_1, x: 0, y: 0, zoom: 1 },
    { src: idle_sw_2, x: 0, y: 0, zoom: 1 },
    { src: idle_sw_3, x: 0, y: 0, zoom: 1 },
    { src: idle_sw_4, x: 1, y: 0, zoom: 1 },
    { src: idle_sw_5, x: 1, y: 0, zoom: 1 },
] as const satisfies readonly SpriteFrame[];

const GOBLIN_IDLE_NW_FRAMES = [
    { src: idle_nw_1, x: 0, y: 0, zoom: 1 },
    { src: idle_nw_2, x: 0, y: 0, zoom: 1 },
    { src: idle_nw_3, x: 0, y: 0, zoom: 1 },
    { src: idle_nw_4, x: 0, y: 0, zoom: 1 },
] as const satisfies readonly SpriteFrame[];

const GOBLIN_WALK_SW_FRAMES = [
    { src: walk_sw_1, x: 5, y: 0, zoom: 1 },
    { src: walk_sw_2, x: 2.5, y: -5.5, zoom: .9 },
    { src: walk_sw_3, x: 2.5, y: -10, zoom: .8 },
    { src: walk_sw_4, x: 4.5, y: -4, zoom: 1 },
    { src: walk_sw_5, x: 4.5, y: -4, zoom: .95 },
    { src: walk_sw_6, x: 3, y: -2.5, zoom: .9 },
    { src: walk_sw_7, x: 1.5, y: -1.5, zoom: .9 },
    { src: walk_sw_8, x: 3.5, y: 0, zoom: 1.025 },
] as const satisfies readonly SpriteFrame[];

export const GOBLIN_ARCHER_SPRITE = {
    layout: {
        heightScale: 3.5,
        zoom: 1,
        position: { x: 0, y: 0 },
    },
    idle: {
        ne: GOBLIN_IDLE_NW_FRAMES[0],
        nw: GOBLIN_IDLE_NW_FRAMES[0],
        se: GOBLIN_IDLE_SW_FRAMES[0],
        sw: GOBLIN_IDLE_SW_FRAMES[0],
    },
    animations: {
        idle: {
            frames: {
                ne: GOBLIN_IDLE_NW_FRAMES,
                nw: GOBLIN_IDLE_NW_FRAMES,
                se: GOBLIN_IDLE_SW_FRAMES,
                sw: GOBLIN_IDLE_SW_FRAMES,
            },
            fps: 8,
            loop: true,
        },
        walking: {
            frames: {
                ne: GOBLIN_WALK_SW_FRAMES,
                nw: GOBLIN_WALK_SW_FRAMES,
                se: GOBLIN_WALK_SW_FRAMES,
                sw: GOBLIN_WALK_SW_FRAMES,
            },
            fps: 12,
            loop: true,
        },
    },
    facingFlips: {
        se: { horizontal: true },
        ne: { horizontal: true },
    },
} as const satisfies EntitySpriteConfig;

export const GOBLIN_ARCHER_STATS = {
    hp: 22,
    speed: 48,
    damage: 14,
    range: 260,
    shootCooldown: 2200,
    scoreValue: 28,
    color: '#84cc16',
    size: 12,
    shadow: {
        anchor: { x: 50, y: 85 },
        size: { x: 36, y: 18 },
    },
    hitbox: {
        x: 36,
        y: 40,
        offset: { x: 0, y: 0 },
    },
    stagger: 10,
    staggerTime: 320,
} as const satisfies EnemyStats;

export class GoblinArcher extends Enemy {
    constructor(x?: number, y?: number) {
        super({
            x: x ?? 0,
            y: y ?? 0,
            type: 'goblinArcher',
            size: GOBLIN_ARCHER_STATS.size,
            hp: GOBLIN_ARCHER_STATS.hp,
            maxHp: GOBLIN_ARCHER_STATS.hp,
            speed: GOBLIN_ARCHER_STATS.speed,
            damage: GOBLIN_ARCHER_STATS.damage,
            range: GOBLIN_ARCHER_STATS.range,
            color: GOBLIN_ARCHER_STATS.color,
            scoreValue: GOBLIN_ARCHER_STATS.scoreValue,
            stagger: GOBLIN_ARCHER_STATS.stagger,
            staggerTime: GOBLIN_ARCHER_STATS.staggerTime,
            hitbox: GOBLIN_ARCHER_STATS.hitbox,
            shadow: GOBLIN_ARCHER_STATS.shadow,
            sprite: GOBLIN_ARCHER_SPRITE,
        });
    }

    update(
        dt: number,
        targetX: number,
        targetY: number,
        arenaWidth: number = CANVAS.width,
        arenaHeight: number = CANVAS.height,
    ): Projectile | null {
        if (this.isStaggered()) {
            super.update(dt, targetX, targetY, arenaWidth, arenaHeight);
            this.tickStaggered(dt);
            return null;
        }

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const elapsed = this.lastShot;
        const insideCanvas = isInsideShadowEntityView(
            this.x,
            this.y,
            this.shadow,
            this.hitbox.x,
            this.hitbox.y,
            arenaWidth,
            arenaHeight,
        );
        const canShoot = insideCanvas && dist > 0 && dist <= this.range;

        if (!canShoot) {
            let moved = false;
            if (dist > 0) {
                moved = true;
                this.faceToward(dx, dy);
                this.x += (dx / dist) * this.speed * dt;
                this.y += (dy / dist) * this.speed * dt;
            }

            super.update(dt, targetX, targetY, arenaWidth, arenaHeight);
            this.tickAnimator(dt, moved);
            return null;
        }

        this.faceToward(dx, dy);

        if (elapsed >= GOBLIN_ARCHER_STATS.shootCooldown) {
            this.lastShot = 0;
            super.update(dt, targetX, targetY, arenaWidth, arenaHeight);
            this.tickAnimator(dt, false, true);

            return {
                x: this.x,
                y: this.y,
                direction: { dx: dx / dist, dy: dy / dist },
                speed: this.speed * 1.5,
                damage: this.damage,
                type: 'enemy',
            };
        }

        super.update(dt, targetX, targetY, arenaWidth, arenaHeight);
        this.tickAnimator(dt, false);
        return null;
    }
}
