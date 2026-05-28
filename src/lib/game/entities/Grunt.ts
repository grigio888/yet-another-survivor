    // Melee-only enemy that chases the player
    import { Enemy } from './Enemy.js';
    import { ENEMIES } from '../config/index.js';

    export class Grunt extends Enemy {
        constructor(x?: number, y?: number) {
            super({
                x: x ?? 0,
                y: y ?? 0,
                type: 'grunt',
                size: ENEMIES.grunt.size,
                hp: ENEMIES.grunt.hp,
                maxHp: ENEMIES.grunt.hp,
                speed: ENEMIES.grunt.speed,
                damage: ENEMIES.grunt.damage,
                color: ENEMIES.grunt.color,
                scoreValue: ENEMIES.grunt.scoreValue,
            });
        }

        update(dt: number, targetX: number, targetY: number) {
            // Move toward target position
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0) {
                const moveX = (dx / dist) * this.speed * dt;
                const moveY = (dy / dist) * this.speed * dt;

                this.x += moveX;
                this.y += moveY;
            }

            super.update(dt, targetX, targetY);
        }
    }