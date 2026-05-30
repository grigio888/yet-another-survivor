import { describe, expect, it } from 'vitest';
import { Shooter } from '$lib/game/entities/enemies/Shooter';
import { ENEMIES } from '$lib/game/config';
import { isInsideCanvasView } from '$lib/game/systems/arenaBounds';

describe('Shooter', () => {
    it('walks toward the player while outside the canvas', () => {
        const shooter = new Shooter(400, -120);
        expect(isInsideCanvasView(shooter.x, shooter.y, shooter.size)).toBe(false);

        const prevY = shooter.y;
        const projectile = shooter.update(1, 400, 300);

        expect(projectile).toBeNull();
        expect(shooter.y).toBeGreaterThan(prevY);
    });

    it('walks toward the player when inside the canvas but out of range', () => {
        const shooter = new Shooter(400, 300);
        const prevY = shooter.y;

        const projectile = shooter.update(1, 400, 20);

        expect(projectile).toBeNull();
        expect(shooter.y).toBeLessThan(prevY);
    });

    it('does not shoot while outside the canvas even when in range', () => {
        const shooter = new Shooter(400, -80);
        shooter.lastShot = ENEMIES.shooter.shootCooldown;

        const projectile = shooter.update(1, 400, 100);

        expect(isInsideCanvasView(shooter.x, shooter.y, shooter.size)).toBe(false);
        expect(projectile).toBeNull();
    });

    it('shoots once inside the canvas and in range', () => {
        const shooter = new Shooter(400, 300);
        shooter.lastShot = ENEMIES.shooter.shootCooldown;

        expect(isInsideCanvasView(shooter.x, shooter.y, shooter.size)).toBe(true);

        const projectile = shooter.update(1, 400, 100);

        expect(projectile).not.toBeNull();
        expect(projectile?.damage).toBe(ENEMIES.shooter.damage);
    });
});
