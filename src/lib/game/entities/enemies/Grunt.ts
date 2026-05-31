// Melee-only enemy that chases the player
import { Enemy } from './Enemy.js';
import type { EnemyStats } from './types.js';

export const GRUNT_STATS = {
    hp: 30,
    speed: 80, // pixels per second
    damage: 1, // reduces player life by this amount
    range: 0, // melee only
    shootCooldown: 0,
    scoreValue: 10,
    color: '#4ade8f', // green
    size: 24,
    shadow: { anchor: { x: 50, y: 50 }, size: { x: 24, y: 12 } },
    hitbox: { x: 24, y: 24 },
    stagger: 8,
    staggerTime: 400,
} as const satisfies EnemyStats;

export class Grunt extends Enemy {
    constructor(x?: number, y?: number) {
        super({
            x: x ?? 0,
            y: y ?? 0,
            type: 'grunt',
            size: GRUNT_STATS.size,
            hp: GRUNT_STATS.hp,
            maxHp: GRUNT_STATS.hp,
            speed: GRUNT_STATS.speed,
            damage: GRUNT_STATS.damage,
            color: GRUNT_STATS.color,
            scoreValue: GRUNT_STATS.scoreValue,
            stagger: GRUNT_STATS.stagger,
            staggerTime: GRUNT_STATS.staggerTime,
            hitbox: GRUNT_STATS.hitbox,
            shadow: GRUNT_STATS.shadow,
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
