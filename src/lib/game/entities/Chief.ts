    // Tanky boss enemy
    import { ENEMIES } from '../config/index.js';
    import { Enemy } from './Enemy.js';

    export class Chief extends Enemy {
        constructor(x?: number, y?: number) {
            super({
                x: x ?? 0,
                y: y ?? 0,
                type: 'chief',
                size: ENEMIES.chief.size,
                hp: ENEMIES.chief.hp,
                maxHp: ENEMIES.chief.hp,
                speed: ENEMIES.chief.speed,
                damage: ENEMIES.chief.damage,
                range: ENEMIES.chief.range,
                color: ENEMIES.chief.color,
                scoreValue: ENEMIES.chief.scoreValue,
            });
        }

        update(dt: number, targetX: number, targetY: number): null {
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Slow but relentless pursuit
            if (dist > 0) {
                const moveX = (dx / dist) * this.speed * dt;
                const moveY = (dy / dist) * this.speed * dt;

                this.x += moveX;
                this.y += moveY;
            }

            super.update(dt, targetX, targetY);
            return null;
        }
    }