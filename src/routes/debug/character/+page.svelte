<script lang="ts">
    import {
        createCharacter,
        CHARACTER_STATS,
        type Character,
        type CharacterId,
    } from '$lib/game/entities/characters';
    import { CANVAS } from '$lib/game/config';
    import {
        drawCharacterVisual,
        loadCharacterSprites,
        snapEightDirection,
        type CharacterSpriteSet,
        type FacingDirection,
    } from '$lib/game/rendering/characterSprites';
    import GameCanvasFrame from '$lib/components/GameCanvasFrame.svelte';
    import DebugPlayground from '$lib/components/DebugPlayground.svelte';
    import CharacterItemLoadout from '$lib/components/CharacterItemLoadout.svelte';
    import DebugHud from '$lib/components/DebugHud.svelte';

    let canvas: HTMLCanvasElement | null = $state(null);
    let character: Character | null = $state(null);
    let sprites = $state<CharacterSpriteSet | null>(null);
    let frameId = $state(0);
    let lastTime = $state(0);
    let keys = $state(new Set<string>());
    let movement = $state({ dx: 0, dy: 0, sprint: false });
    let invincible = $state(false);
    let timeAlive = $state(0);
    let facing = $state<FacingDirection>({ dx: 0, dy: 1 });
    let arenaWidth = $state(CANVAS.width);
    let arenaHeight = $state(CANVAS.height);
    let hudLines = $state<string[]>([]);

    const characterClasses: { label: string; type: CharacterId }[] = [
        { label: 'Mage', type: 'mage' },
        { label: 'Peasant', type: 'peasant' },
    ];

    function characterConfig(c: Character) {
        return CHARACTER_STATS[c.type as CharacterId];
    }

    const FACING_LABELS: Record<string, string> = {
        '0,-1': 'N',
        '1,-1': 'NE',
        '1,0': 'E',
        '1,1': 'SE',
        '0,1': 'S',
        '-1,1': 'SW',
        '-1,0': 'W',
        '-1,-1': 'NW',
    };

    function facingLabel(): string {
        const key = `${Math.sign(facing.dx)},${Math.sign(facing.dy)}`;
        return FACING_LABELS[key] ?? '?';
    }

    function onKeydown(e: KeyboardEvent) {
        keys.add(e.key.toLowerCase());
        recalcMovement();
    }

    function onKeyup(e: KeyboardEvent) {
        keys.delete(e.key.toLowerCase());
        recalcMovement();
    }

    function recalcMovement() {
        let dx = 0, dy = 0;
        let sprint = false;
        if (keys.has('w') || keys.has('arrowup')) dy -= 1;
        if (keys.has('s') || keys.has('arrowdown')) dy += 1;
        if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
        if (keys.has('d') || keys.has('arrowright')) dx += 1;
        sprint = keys.has('shift');

        if (dx !== 0 || dy !== 0) {
            facing = snapEightDirection(dx, dy);
        }

        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
            dx /= len;
            dy /= len;
        }
        movement = { dx, dy, sprint };
    }

    function takeDamage() {
        character?.takeDamage(1);
    }

    function healFull() {
        if (character) {
            const config = characterConfig(character);
            character.hp = character.maxHp;
            character.lives = config.maxLives;
        }
    }

    function resetCharacter(type: CharacterId = (character?.type as CharacterId) ?? 'mage') {
        character = createCharacter(type, arenaWidth / 2, arenaHeight / 2);
        facing = { dx: 0, dy: 1 };
        timeAlive = 0;
    }

    async function switchCharacter(type: CharacterId) {
        resetCharacter(type);
        sprites = await loadCharacterSprites(type);
    }

    function loop(now: number) {
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;

        if (character) {
            character.update(dt, movement);
            character.x = Math.max(
                character.size / 2,
                Math.min(arenaWidth - character.size / 2, character.x),
            );
            character.y = Math.max(
                character.size / 2,
                Math.min(arenaHeight - character.size / 2, character.y),
            );
            timeAlive += dt;
            invincible = character.isInvincible();
        }

        draw();
        syncHud();
        frameId = requestAnimationFrame(loop);
    }

    function syncHud() {
        if (!character) {
            hudLines = [];
            return;
        }

        hudLines = [
            `type: ${character.type}`,
            `pos: (${character.x.toFixed(1)}, ${character.y.toFixed(1)})`,
            `hp: ${character.hp} / ${character.maxHp}`,
            `lives: ${character.lives}`,
            `invincible: ${invincible}`,
            `active: ${character.inventory.getActiveCount()}/4`,
            `passive: ${character.inventory.getPassiveCount()}/4`,
            `speed: ${movement.sprint ? characterConfig(character).speed * 2 : characterConfig(character).speed}`,
            `time: ${timeAlive.toFixed(1)}s`,
            `facing: ${facingLabel()}`,
        ];
    }

    function drawGround(ctx: CanvasRenderingContext2D) {
        const tile = 48;

        const grad = ctx.createLinearGradient(0, 0, 0, arenaHeight);
        grad.addColorStop(0, '#f1f5f9');
        grad.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, arenaWidth, arenaHeight);

        for (let ty = 0; ty < arenaHeight + tile; ty += tile) {
            for (let tx = 0; tx < arenaWidth + tile; tx += tile) {
                const even = ((tx / tile) + (ty / tile)) % 2 === 0;
                ctx.fillStyle = even ? 'rgba(255, 255, 255, 0.35)' : 'rgba(148, 163, 184, 0.08)';
                ctx.fillRect(tx, ty, tile, tile);
            }
        }

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
        ctx.lineWidth = 1;
        for (let gx = 0; gx <= arenaWidth; gx += tile) {
            ctx.beginPath();
            ctx.moveTo(gx, 0);
            ctx.lineTo(gx, arenaHeight);
            ctx.stroke();
        }
        for (let gy = 0; gy <= arenaHeight; gy += tile) {
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(arenaWidth, gy);
            ctx.stroke();
        }
    }

    function draw() {
        const ctx = canvas?.getContext('2d');
        if (!ctx || !character) return;

        drawGround(ctx);

        if (invincible) {
            ctx.globalAlpha = 0.5;
        }

        drawCharacterVisual(ctx, character, facing, sprites, { showRange: true });
        ctx.globalAlpha = 1;

        if (invincible) {
            ctx.fillStyle = '#000';
            ctx.font = '14px monospace';
            ctx.fillText('INVULNERABLE', character.x + 20, character.y);
        }
    }

    $effect(() => {
        if (arenaWidth <= 0 || arenaHeight <= 0 || character) return;
        character = createCharacter('mage', arenaWidth / 2, arenaHeight / 2);
        loadCharacterSprites('mage').then((loaded) => {
            sprites = loaded;
        });
    });

    $effect(() => {
        lastTime = performance.now();
        frameId = requestAnimationFrame(loop);
        window.addEventListener('keydown', onKeydown);
        window.addEventListener('keyup', onKeyup);

        return () => {
            if (frameId) cancelAnimationFrame(frameId);
            window.removeEventListener('keydown', onKeydown);
            window.removeEventListener('keyup', onKeyup);
        };
    });
</script>

<DebugPlayground>
    {#snippet children()}
        <div class="relative h-full w-full">
            <GameCanvasFrame fill bind:width={arenaWidth} bind:height={arenaHeight} bind:canvas />
            <DebugHud lines={hudLines} class="absolute top-3 right-3 z-10 font-[family-name:var(--default-font)]" />
            {#if character}
                <CharacterItemLoadout
                    inventory={character.inventory}
                    class="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2"
                    showLabels={false}
                />
            {/if}
        </div>
    {/snippet}

    {#snippet left()}
        <div class="flex flex-col gap-2">
            <h3 class="text-lg font-bold">Character</h3>
            <div class="flex flex-wrap gap-2">
                {#each characterClasses as cc}
                    <button
                        class="rounded-md px-3 py-1 text-sm transition-colors duration-200 {character?.type === cc.type ? 'bg-(--theme-color-600) text-white' : 'bg-gray-200 hover:bg-gray-300'}"
                        onclick={() => switchCharacter(cc.type)}
                    >
                        {cc.label}
                    </button>
                {/each}
            </div>
            <p class="text-sm text-(--text-color-muted)">Active: {character?.type ?? '—'}</p>
        </div>
        <hr class="h-px border-(--border-color)/40" />
        <div class="flex flex-col gap-2">
            <button class="rounded-md bg-(--theme-color-600) px-4 py-2 text-white transition-colors duration-200 hover:bg-(--theme-color-700)" onclick={takeDamage}>Take Damage (-1 life)</button>
            <button class="rounded-md bg-(--theme-color-600) px-4 py-2 text-white transition-colors duration-200 hover:bg-(--theme-color-700)" onclick={healFull}>Full Heal</button>
            <button class="rounded-md bg-(--theme-color-600) px-4 py-2 text-white transition-colors duration-200 hover:bg-(--theme-color-700)" onclick={() => resetCharacter()}>Reset</button>
        </div>
    {/snippet}

    {#snippet right()}
        <div class="flex flex-col gap-2">
            <h3 class="text-lg font-bold">Controls</h3>
            <p class="text-sm text-(--text-color-muted)">WASD/Arrows: Move</p>
            <p class="text-sm text-(--text-color-muted)">Shift: Sprint (2x speed)</p>
            <p class="text-sm text-(--text-color-muted)">Render: shadow + sprite (dashed ring = hitbox, blue = range)</p>
        </div>
        <hr class="h-px border-(--border-color)/40" />
        <div class="flex flex-col gap-2">
            <h3 class="text-lg font-bold">Stats</h3>
            {#if character}
                {@const config = characterConfig(character)}
                <p class="text-sm text-(--text-color-muted)">Type: {character.type}</p>
                <p class="text-sm text-(--text-color-muted)">Max Lives: {config.maxLives}</p>
                <p class="text-sm text-(--text-color-muted)">Speed: {config.speed} px/s</p>
                <p class="text-sm text-(--text-color-muted)">Max range: {character.attackStats.range}px</p>
                <p class="text-sm text-(--text-color-muted)">Damage: {character.attackStats.projectileDamage}</p>
                <p class="text-sm text-(--text-color-muted)">Invuln: {config.invincibleFrames}ms</p>
            {/if}
        </div>
    {/snippet}
</DebugPlayground>
