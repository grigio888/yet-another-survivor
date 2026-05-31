import { describe, expect, it } from 'vitest';
import { Shooter, SHOOTER_STATS } from '$lib/game/entities/enemies/Shooter';
import { isInsideShadowEntityView } from '$lib/game/systems/arenaBounds';

describe('Shooter', () => {
    it('walks toward the player while outside the canvas', () => {
        const shooter = new Shooter(400, -120);
        expect(
            isInsideShadowEntityView(
                shooter.x,
                shooter.y,
                shooter.shadow,
                shooter.hitbox.x,
                shooter.hitbox.y,
            ),
        ).toBe(false);

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
        shooter.lastShot = SHOOTER_STATS.shootCooldown;

        const projectile = shooter.update(1, 400, 100);

        expect(
            isInsideShadowEntityView(
                shooter.x,
                shooter.y,
                shooter.shadow,
                shooter.hitbox.x,
                shooter.hitbox.y,
            ),
        ).toBe(false);
        expect(projectile).toBeNull();
    });

    it('shoots once inside the canvas and in range', () => {
        const shooter = new Shooter(400, 300);
        shooter.lastShot = SHOOTER_STATS.shootCooldown;

        expect(
            isInsideShadowEntityView(
                shooter.x,
                shooter.y,
                shooter.shadow,
                shooter.hitbox.x,
                shooter.hitbox.y,
            ),
        ).toBe(true);

        const projectile = shooter.update(1, 400, 100);

        expect(projectile).not.toBeNull();
        expect(projectile?.damage).toBe(SHOOTER_STATS.damage);
    });

    it('shoots when inside a viewport larger than the default CANVAS size', () => {
        const shooter = new Shooter(1200, 400);
        shooter.lastShot = SHOOTER_STATS.shootCooldown;
        const arenaWidth = 1600;
        const arenaHeight = 900;

        expect(
            isInsideShadowEntityView(
                shooter.x,
                shooter.y,
                shooter.shadow,
                shooter.hitbox.x,
                shooter.hitbox.y,
                arenaWidth,
                arenaHeight,
            ),
        ).toBe(true);
        expect(
            isInsideShadowEntityView(
                shooter.x,
                shooter.y,
                shooter.shadow,
                shooter.hitbox.x,
                shooter.hitbox.y,
            ),
        ).toBe(false);

        const projectile = shooter.update(1, 1200, 550, arenaWidth, arenaHeight);

        expect(projectile).not.toBeNull();
    });
});
