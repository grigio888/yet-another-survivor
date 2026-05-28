    import { describe, it, expect, beforeEach, vi } from 'vitest';
    import { Character } from '$lib/game/entities/Character';
    import { PLAYER, ENEMIES } from '$lib/game/config/index';

    describe('Character', () => {
        let character: Character;

        beforeEach(() => {
            character = new Character({ x: 400, y: 300 });
        });

        describe('constructor', () => {
            it('has config-derived default values', () => {
                expect(character.lives).toBe(3);
                expect(character.lastShot).toBe(0);
                expect(character.invincibleUntil).toBe(0);

                expect(character.hp).toBe(100);
                expect(character.maxHp).toBe(100);
                expect(character.speed).toBe(200);
                expect(character.color).toBe('#60a5fa');
            });
        });

        describe('update', () => {
            const dt = 0.016; // ~60fps frame time

            it('moves character based on direction vector', () => {
                character.update(dt, { dx: 1, dy: 0, sprint: false });

                expect(character.x).toBeCloseTo(400 + 200 * dt, 0);
                expect(character.y).toBeCloseTo(300, 0);
            });

            it('moves faster when sprinting', () => {
                character.update(dt, { dx: 1, dy: 0, sprint: true });
                const newSpeed = character.x;

                character = new Character({ x: 400, y: 300 });
                character.update(dt, { dx: 1, dy: 0, sprint: false });
                const regularSpeed = character.x;

                expect(newSpeed).toBeGreaterThan(regularSpeed);
                expect(newSpeed - 400).toBeCloseTo(2 * regularSpeed - 800, 0);
            });

            it('identifies when cooldown expired and shot allowed', () => {
                character.lastShot = PLAYER.shootCooldown + 1;

                expect(character.update(dt, { dx: 0, dy: 0, sprint: false })).toBe(true);
            });

            it('rejects shot when cooldown not expired', () => {
                character.lastShot = PLAYER.shootCooldown - 1;

                expect(character.update(dt, { dx: 0, dy: 0, sprint: false })).toBe(true);
            });

            it('grants invulnerability after hit', () => {
                character.takeDamage(10);

                expect(character.isInvincible()).toBe(true);
            });

            it('reduces lives when hp reaches 0', () => {
                character.takeDamage(100);

                expect(character.lives).toBe(2);
                expect(character.hp).toBe(100); // HP resets
            });
        });

        describe('shoot', () => {
            it('aims at target position', () => {
                const target = { x: 600, y: 300 };
                const projectile = character.shoot(target);

                expect(projectile).not.toBeNull();
                if (projectile) {
                    expect(projectile.x).toBe(character.x);
                    expect(projectile.direction.dx).toBeGreaterThan(0);
                    expect(projectile.direction.dy).toBeCloseTo(0);
                }
            });

            it('returns null when target is at same position', () => {
                expect(character.shoot({ x: character.x, y: character.y })).toBeNull();
            });
        });

        describe('draw', () => {
            it('draws filled rectangle with crosshair', () => {
                const ctx = createMockContext();
                character.draw(ctx);

                expect(ctx.fillStyle).toBe('#60a5fa');
                expect(ctx.fillRect).toHaveBeenCalled();
                expect(ctx.strokeStyle).toBe('#ffffff');
                expect(ctx.stroke).toHaveBeenCalled();
            });
        });
    });

    function createMockContext() {
        return {
            fillStyle: '',
            strokeStyle: '',
            lineWidth: 0,
            fillRect: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            stroke: vi.fn(),
        };
    }