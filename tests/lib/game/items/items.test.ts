import { describe, expect, it } from 'vitest';
import { Mage } from '$lib/game/entities/characters';
import { FIREBALL_ITEM, MAX_ACTIVE_ITEMS, MAX_PASSIVE_ITEMS } from '$lib/game/items';
import { ItemInventory } from '$lib/game/items/Inventory';

describe('FIREBALL_ITEM', () => {
    it('is an active projectile item', () => {
        expect(FIREBALL_ITEM.kind).toBe('active');
        expect(FIREBALL_ITEM.active?.kind).toBe('projectile');
        expect(FIREBALL_ITEM.active?.projectileType).toBe('fireball');
        expect(FIREBALL_ITEM.sprite?.url).toBeTruthy();
        expect(FIREBALL_ITEM.sprite?.size).toBe(20);
    });
});

describe('ItemInventory', () => {
    const base = { speed: 160, maxLives: 3, maxHp: 70 };

    it('equips fireball into an active slot', () => {
        const inventory = new ItemInventory();
        expect(inventory.equip('fireball')).toBe(true);

        expect(inventory.getActiveItemIds()).toEqual(['fireball']);
        expect(inventory.getAttackStats(base).projectileDamage).toBe(25);
        expect(inventory.getAttackStats(base).range).toBe(150);
    });

    it('allows up to four active and four passive items', () => {
        const inventory = new ItemInventory();

        for (let i = 0; i < MAX_ACTIVE_ITEMS; i++) {
            expect(inventory.equip('fireball')).toBe(true);
        }
        expect(inventory.equip('fireball')).toBe(false);
        expect(inventory.getActiveCount()).toBe(MAX_ACTIVE_ITEMS);

        for (let i = 0; i < MAX_PASSIVE_ITEMS; i++) {
            expect(inventory.equip('swift_boots')).toBe(true);
        }
        expect(inventory.equip('swift_boots')).toBe(false);
        expect(inventory.getPassiveCount()).toBe(MAX_PASSIVE_ITEMS);
    });

    it('applies passive perks from all equipped passive items to every active attack', () => {
        const inventory = new ItemInventory();
        inventory.equip('fireball');
        inventory.equip('swift_boots');

        const stats = inventory.getAttackStats(base);
        expect(stats.projectileSpeed).toBe(FIREBALL_ITEM.active!.speed + 10);
    });

    it('fires a projectile from each ready active item', () => {
        const inventory = new ItemInventory();
        inventory.equip('fireball');
        inventory.equip('fireball');

        const projectiles = inventory.fireAll(base, { x: 400, y: 300 }, { x: 480, y: 300 });

        expect(projectiles).toHaveLength(2);
        expect(projectiles.every((p) => p.type === 'fireball')).toBe(true);
    });

    it('tracks cooldowns independently per active slot', () => {
        const inventory = new ItemInventory();
        inventory.equip('fireball');
        inventory.equip('fireball');

        inventory.fireAll(base, { x: 400, y: 300 }, { x: 480, y: 300 });
        expect(inventory.canFireAny(base)).toBe(false);

        inventory.tick(0.5);
        expect(inventory.canFireAny(base)).toBe(true);
    });
});

describe('Character items integration', () => {
    it('starts with fireball equipped in an active slot', () => {
        const mage = new Mage(400, 300);

        expect(mage.inventory.getActiveItemIds()).toEqual(['fireball']);
        expect(mage.attackStats.projectileDamage).toBe(25);
        expect(mage.range).toBe(150);

        const projectiles = mage.shoot({ x: 480, y: 300 });
        expect(projectiles).toHaveLength(1);
        expect(projectiles[0]?.type).toBe('fireball');
    });
});
