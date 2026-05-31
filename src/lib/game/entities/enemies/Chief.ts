// Tanky boss enemy
import { Enemy } from './Enemy.js';
import type { EnemyStats } from './types.js';

export const CHIEF_STATS = {
    hp: 150,
    speed: 35,
    damage: 2,
    range: 0,
    shootCooldown: 0,
    scoreValue: 100,
    color: '#f43f5e', // pink/red
    size: 36,
    shadow: { anchor: { x: 50, y: 50 }, size: { x: 36, y: 18 } },
    hitbox: { x: 36, y: 36 },
    stagger: 30,
    staggerTime: 250,
} as const satisfies EnemyStats;

export class Chief extends Enemy {
    constructor(x?: number, y?: number) {
        super({
            x: x ?? 0,
            y: y ?? 0,
            type: 'chief',
            size: CHIEF_STATS.size,
            hp: CHIEF_STATS.hp,
            maxHp: CHIEF_STATS.hp,
            speed: CHIEF_STATS.speed,
            damage: CHIEF_STATS.damage,
            range: CHIEF_STATS.range,
            color: CHIEF_STATS.color,
            scoreValue: CHIEF_STATS.scoreValue,
            stagger: CHIEF_STATS.stagger,
            staggerTime: CHIEF_STATS.staggerTime,
            hitbox: CHIEF_STATS.hitbox,
            shadow: CHIEF_STATS.shadow,
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
