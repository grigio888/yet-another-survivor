    import { describe, it, expect, beforeEach, vi } from 'vitest';
    import { Mage, MAGE_STATS } from '$lib/game/entities/characters';

    describe('Mage', () => {
        let character: Mage;

        beforeEach(() => {
            character = new Mage(400, 300);
        });

        describe('constructor', () => {
            it('has config-derived default values', () => {
                expect(character.lives).toBe(3);
                expect(character.lastShot).toBe(0);
                expect(character.invincibleUntil).toBe(0);

                expect(character.hp).toBe(MAGE_STATS.maxHp);
                expect(character.maxHp).toBe(MAGE_STATS.maxHp);
                expect(character.speed).toBe(MAGE_STATS.speed);
                expect(character.color).toBe(MAGE_STATS.color);
                expect(character.type).toBe('mage');
                expect(character.range).toBe(MAGE_STATS.range);
                expect(character.sprite).toEqual(MAGE_STATS.sprite);
            });
        });

        describe('update', () => {
            const dt = 0.016; // ~60fps frame time

            it('moves character based on direction vector', () => {
                character.update(dt, { dx: 1, dy: 0, sprint: false });

                expect(character.x).toBeCloseTo(400 + MAGE_STATS.speed * dt, 0);
                expect(character.y).toBeCloseTo(300, 0);
            });

            it('moves faster when sprinting', () => {
                character.update(dt, { dx: 1, dy: 0, sprint: true });
                const newSpeed = character.x;

                character = new Mage(400, 300);
                character.update(dt, { dx: 1, dy: 0, sprint: false });
                const regularSpeed = character.x;

                expect(newSpeed).toBeGreaterThan(regularSpeed);
                expect(newSpeed - 400).toBeCloseTo(2 * regularSpeed - 800, 0);
            });

            it('identifies when cooldown expired and shot allowed', () => {
                character.lastShot = MAGE_STATS.shootCooldown + 1;

                expect(character.update(dt, { dx: 0, dy: 0, sprint: false })).toBe(true);
            });

            it('returns false from update when shoot cooldown has not elapsed', () => {
                character.lastShot = 0;

                expect(character.update(dt, { dx: 0, dy: 0, sprint: false })).toBe(false);
            });

            it('grants invulnerability after hit', () => {
                character.takeDamage(10);

                expect(character.isInvincible()).toBe(true);
            });

            it('reduces lives when hp reaches 0', () => {
                character.takeDamage(100);

                expect(character.lives).toBe(2);
                expect(character.hp).toBe(MAGE_STATS.maxHp);
            });
        });

        describe('shoot', () => {
            it('aims at target position', () => {
                const target = { x: 480, y: 300 };
                const projectile = character.shoot(target);

                expect(projectile).not.toBeNull();
                if (projectile) {
                    expect(projectile.x).toBe(character.x);
                    expect(projectile.direction.dx).toBeGreaterThan(0);
                    expect(projectile.direction.dy).toBeCloseTo(0);
                    expect(projectile.speed).toBe(MAGE_STATS.projectileSpeed);
                    expect(projectile.damage).toBe(MAGE_STATS.projectileDamage);
                }
            });

            it('returns null when target is at same position', () => {
                expect(character.shoot({ x: character.x, y: character.y })).toBeNull();
            });

            it('returns null when target is out of range', () => {
                const outOfRange = {
                    x: character.x + MAGE_STATS.range + 50,
                    y: character.y,
                };

                expect(character.shoot(outOfRange)).toBeNull();
            });
        });

        describe('findNearestInRange', () => {
            it('returns the closest target within range', () => {
                const near = { x: character.x + 100, y: character.y };
                const far = { x: character.x + MAGE_STATS.range + 100, y: character.y };

                expect(character.findNearestInRange([far, near])).toBe(near);
            });

            it('returns null when no targets are in range', () => {
                const far = { x: character.x + MAGE_STATS.range + 1, y: character.y };

                expect(character.findNearestInRange([far])).toBeNull();
            });
        });

        describe('isInRange', () => {
            it('returns true for targets within range', () => {
                expect(character.isInRange({ x: character.x + 100, y: character.y })).toBe(true);
            });

            it('returns false for targets beyond range', () => {
                expect(
                    character.isInRange({ x: character.x + MAGE_STATS.range + 1, y: character.y })
                ).toBe(false);
            });
        });

        describe('draw', () => {
            it('draws filled rectangle with crosshair', () => {
                const ctx = createMockContext();
                character.draw(ctx);

                expect(ctx.fillStyle).toBe(MAGE_STATS.color);
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
