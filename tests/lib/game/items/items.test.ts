import { describe, expect, it } from 'vitest';
import { Mage } from '$lib/game/entities/characters';
import {
    ARCANE_NOVA_ITEM,
    FIREBALL_ITEM,
    IRON_SWORD_ITEM,
    MAX_ACTIVE_ITEMS,
    MAX_PASSIVE_ITEMS,
    THROWING_SPEAR_ITEM,
    collectItemVisualUrls,
    getItemVisualUrls,
    isActiveItemVisuals,
    worldVisualMatchesAttack,
} from '$lib/game/items';
import { ItemInventory, splitItemUseResults } from '$lib/game/items/Inventory';
import { findAreaCircleHits, findMeleeArcHits } from '$lib/game/systems/itemCombat';
import { Grunt } from '$lib/game/entities/enemies';

describe('item catalog', () => {
    it('defines one item per weapon shape', () => {
        expect(FIREBALL_ITEM.active?.kind).toBe('projectile');
        expect(THROWING_SPEAR_ITEM.active?.kind).toBe('projectile');
        expect(IRON_SWORD_ITEM.active?.kind).toBe('melee');
        expect(ARCANE_NOVA_ITEM.active?.kind).toBe('area');
    });

    it('pairs visuals with attack kind', () => {
        for (const item of [FIREBALL_ITEM, THROWING_SPEAR_ITEM, IRON_SWORD_ITEM, ARCANE_NOVA_ITEM]) {
            expect(isActiveItemVisuals(item.visuals!)).toBe(true);
            if (isActiveItemVisuals(item.visuals!)) {
                expect(worldVisualMatchesAttack(item.visuals, item.active!.kind)).toBe(true);
            }
        }
    });

    it('collects unique visual URLs from the registry', () => {
        expect(getItemVisualUrls().length).toBeGreaterThanOrEqual(4);
        expect(collectItemVisualUrls(FIREBALL_ITEM).length).toBeGreaterThan(0);
    });
});

describe('ItemInventory', () => {
    const base = { speed: 160, maxLives: 3, maxHp: 70 };

    it('equips fireball into an active slot', () => {
        const inventory = new ItemInventory();
        expect(inventory.equip('fireball')).toBe(true);

        expect(inventory.getActiveItemIds()).toEqual(['fireball']);
        const stats = inventory.getResolvedActiveStats(base, 'fireball');
        expect(stats.kind).toBe('projectile');
        if (stats.kind === 'projectile') {
            expect(stats.damage).toBe(25);
            expect(stats.range).toBe(150);
        }
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

    it('applies passive perks from all equipped passive items to projectile attacks', () => {
        const inventory = new ItemInventory();
        inventory.equip('fireball');
        inventory.equip('swift_boots');

        const stats = inventory.getResolvedActiveStats(base, 'fireball');
        expect(stats.kind).toBe('projectile');
        if (stats.kind === 'projectile') {
            expect(stats.speed).toBe(FIREBALL_ITEM.active!.speed + 10);
        }
    });

    it('fires projectiles and spawns melee/area effects together', () => {
        const inventory = new ItemInventory();
        inventory.equip('fireball');
        inventory.equip('iron_sword');
        inventory.equip('arcane_nova');

        const results = inventory.useAllActives(base, { x: 400, y: 300 }, { x: 460, y: 300 });
        const split = splitItemUseResults(results);

        expect(split.projectiles).toHaveLength(1);
        expect(split.effects).toHaveLength(2);
        expect(split.projectiles[0]?.type).toBe('fireball');
        expect(split.effects.some((effect) => effect.kind === 'melee')).toBe(true);
        expect(split.effects.some((effect) => effect.kind === 'area')).toBe(true);
    });

    it('tracks cooldowns independently per active slot', () => {
        const inventory = new ItemInventory();
        inventory.equip('fireball');
        inventory.equip('fireball');

        inventory.useAllActives(base, { x: 400, y: 300 }, { x: 480, y: 300 });
        expect(inventory.canFireAny(base)).toBe(false);

        inventory.tick(0.5);
        expect(inventory.canFireAny(base)).toBe(true);
    });
});

describe('item combat helpers', () => {
    it('finds enemies in a melee arc', () => {
        const grunt = new Grunt(460, 300);
        const hits = findMeleeArcHits(
            {
                kind: 'melee',
                itemId: 'iron_sword',
                x: 400,
                y: 300,
                facing: { dx: 1, dy: 0 },
                damage: 30,
                reach: 80,
                arcDegrees: 120,
                elapsedMs: 0,
                durationMs: 200,
                damageApplied: false,
            },
            [grunt],
        );

        expect(hits).toEqual([0]);
    });

    it('finds enemies inside an area circle', () => {
        const grunt = new Grunt(450, 300);
        const hits = findAreaCircleHits(
            {
                kind: 'area',
                itemId: 'arcane_nova',
                x: 450,
                y: 300,
                radius: 56,
                damage: 20,
                elapsedMs: 0,
                durationMs: 450,
                damageApplied: false,
            },
            [grunt],
        );

        expect(hits).toEqual([0]);
    });
});

describe('Character items integration', () => {
    it('starts with all four default active weapons equipped', () => {
        const mage = new Mage(400, 300);

        expect(mage.inventory.getActiveItemIds()).toEqual([
            'fireball',
            'throwing_spear',
            'iron_sword',
            'arcane_nova',
        ]);
        expect(mage.attackStats.kind).toBe('projectile');
        if (mage.attackStats.kind === 'projectile') {
            expect(mage.attackStats.damage).toBe(THROWING_SPEAR_ITEM.active!.damage);
        }
        expect(mage.range).toBe(180);

        const split = splitItemUseResults(
            mage.useItems({
                x: 460,
                y: 300,
                shadow: { anchor: { x: 50, y: 50 }, size: { x: 20, y: 10 } },
            }),
        );
        expect(split.projectiles.length).toBeGreaterThan(0);
        expect(split.effects.length).toBeGreaterThan(0);
    });
});
