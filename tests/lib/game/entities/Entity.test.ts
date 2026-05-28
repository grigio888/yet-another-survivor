    import { describe, it, expect, beforeEach, vi } from 'vitest';
    import { Entity } from '$lib/game/entities/Entity';

    describe('Entity', () => {
        let entity: Entity;

        beforeEach(() => {
            entity = new Entity({
                x: 100,
                y: 200,
                size: 30,
                hp: 50,
                maxHp: 50,
                speed: 100,
                damage: 10,
                color: '#ff0000',
            });
        });

        describe('constructor', () => {
            it('uses provided values', () => {
                expect(entity.x).toBe(100);
                expect(entity.y).toBe(200);
                expect(entity.size).toBe(30);
                expect(entity.hp).toBe(50);
                expect(entity.maxHp).toBe(50);
                expect(entity.speed).toBe(100);
                expect(entity.damage).toBe(10);
                expect(entity.color).toBe('#ff0000');
            });

            it('uses default values when not provided', () => {
                const defaultEntity = new Entity();
                expect(defaultEntity.x).toBe(0);
                expect(defaultEntity.y).toBe(0);
                expect(defaultEntity.size).toBe(20);
                expect(defaultEntity.hp).toBe(100);
                expect(defaultEntity.speed).toBe(100);
                expect(defaultEntity.damage).toBe(0);
                expect(defaultEntity.color).toBe('#888888');
            });

            it('sets width and height equal to size', () => {
                expect(entity.width).toBe(30);
                expect(entity.height).toBe(30);
            });
        });

        describe('damage', () => {
            it('reduces hp when taking damage', () => {
                entity.takeDamage(20);
                expect(entity.hp).toBe(30);
            });

            it('uses 0 damage by default', () => {
                const defaultEntity = new Entity();
                expect(defaultEntity.damage).toBe(0);
            });
        });

        describe('isAlive', () => {
            it('returns true when hp above 0', () => {
                expect(entity.isAlive()).toBe(true);
            });

            it('returns false when hp reaches 0', () => {
                entity.takeDamage(50);
                expect(entity.isAlive()).toBe(false);
            });

            it('returns false when hp goes below 0', () => {
                entity.takeDamage(60);
                expect(entity.isAlive()).toBe(false);
                expect(entity.hp).toBe(-10);
            });
        });

        describe('collidesWith', () => {
            it('detects collision between overlapping entities', () => {
                const other = new Entity({ x: 115, y: 215, size: 30 });
                expect(entity.collidesWith(other)).toBe(true);
            });

            it('returns false for distant entities', () => {
                const farEntity = new Entity({ x: 500, y: 500, size: 30 });
                expect(entity.collidesWith(farEntity)).toBe(false);
            });

            it('detects partial overlap', () => {
                const partialEntity = new Entity({ x: 120, y: 220, size: 30 });
                expect(entity.collidesWith(partialEntity)).toBe(true);
            });

            it('detects non-collision for separate entities', () => {
                // Entity edges are at 85-115, other edges are at 145-145
                // these should not collide
                const other = new Entity({ x: 150, y: 250, size: 30 });
                expect(entity.collidesWith(other)).toBe(false);
            });

            it('correctly handles different size collision detection', () => {
                const smallEntity = new Entity({ x: 110, y: 210, size: 10 });
                expect(entity.collidesWith(smallEntity)).toBe(true);
            });
        });

        describe('draw', () => {
            it('draws filled rectangle at entity position', () => {
                const ctx = createMockContext();
                entity.draw(ctx);

                expect((ctx as any).fillStyle).toBe('#ff0000');

                // Should draw a 30x30 box offset by size/2
                expect(ctx.fillRect).toHaveBeenCalledWith(
                    entity.x - entity.size / 2,
                    entity.y - entity.size / 2,
                    entity.size,
                    entity.size,
                );
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