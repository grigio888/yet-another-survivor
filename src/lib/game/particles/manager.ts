export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
}

export class ParticleManager {
    private particles: Particle[] = [];

    get count(): number {
        return this.particles.length;
    }

    emitExplosion(x: number, y: number, color: string, count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
            const speed = 40 + Math.random() * 80;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.35 + Math.random() * 0.25,
                maxLife: 0.6,
                size: 2 + Math.random() * 3,
                color,
            });
        }
    }

    emitSpark(x: number, y: number, count = 6) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 50;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.15 + Math.random() * 0.15,
                maxLife: 0.3,
                size: 1.5 + Math.random() * 2,
                color: '#fca5a5',
            });
        }
    }

    update(dt: number) {
        for (const particle of this.particles) {
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            particle.vx *= 0.92;
            particle.vy *= 0.92;
            particle.life -= dt;
        }

        this.particles = this.particles.filter((particle) => particle.life > 0);
    }

    draw(ctx: CanvasRenderingContext2D) {
        for (const particle of this.particles) {
            const alpha = Math.max(0, particle.life / particle.maxLife);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    clear() {
        this.particles = [];
    }
}
