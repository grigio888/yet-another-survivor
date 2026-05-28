    // Base class for all game entities
    export class Entity {
        public x: number;
        public y: number;
        public width: number;
        public height: number;
        public hp: number;
        public maxHp: number;
        public speed: number;
        public damage: number;
        public color: string;
        public size: number;

        constructor({x, y, size, hp,maxHp, speed, damage, color}: {
            x?: number;
            y?: number;
            size?: number;
            hp?: number;
            maxHp?: number;
            speed?: number;
            damage?: number;
            color?: string;
        } = {}) {
            this.x = x ?? 0;
            this.y = y ?? 0;
            this.size = size ?? 20;
            this.width = size ?? 20;
            this.height = size ?? 20;
            this.hp = hp ?? 100;
            this.maxHp = maxHp ?? hp ?? 100;
            this.speed = speed ?? 100;
            this.damage = damage ?? 0;
            this.color = color ?? '#888888';
        }

        // Update entity state each frame
        update(dt: number) {
            // Override in subclasses
        }

        // Draw entity on canvas
        draw(ctx: CanvasRenderingContext2D) {
            ctx.fillStyle = this.color;
            ctx.fillRect(
                this.x - this.size / 2,
                this.y - this.size / 2,
                this.size,
                this.size
            );
        }

        // Take damage
        takeDamage(amount: number) {
            this.hp -= amount;
        }

        // Check if entity is alive
        isAlive() {
            return this.hp > 0;
        }

        // Calculate collision with another entity (AABB)
        collidesWith(other: Entity) {
            return !(
                this.x + this.size / 2 < other.x - other.size / 2 ||
                this.x - this.size / 2 > other.x + other.size / 2 ||
                this.y + this.size / 2 < other.y - other.size / 2 ||
                this.y - this.size / 2 > other.y + other.size / 2
            );
        }
    }