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
    import { drawDebugHud } from '$lib/game/rendering/debugHud';

    let canvas: HTMLCanvasElement | null = $state(null);
    let guiCanvas: HTMLCanvasElement | null = $state(null);
    let character: Character | null = $state(null);
    let sprites = $state<CharacterSpriteSet | null>(null);
    let frameId = $state(0);
    let lastTime = $state(0);
    let keys = $state(new Set<string>());
    let movement = $state({ dx: 0, dy: 0, sprint: false });
    let invincible = $state(false);
    let timeAlive = $state(0);
    // Last snapped 8-way facing; persists while idle
    let facing = $state<FacingDirection>({ dx: 0, dy: 1 });

    const W = CANVAS.width;
    const H = CANVAS.height;

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
        character = createCharacter(type, W / 2, H / 2);
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
            character.x = Math.max(character.size / 2, Math.min(W - character.size / 2, character.x));
            character.y = Math.max(character.size / 2, Math.min(H - character.size / 2, character.y));
            timeAlive += dt;
            invincible = character.isInvincible();
        }

        draw();
        drawGui();
        frameId = requestAnimationFrame(loop);
    }

    function drawGui() {
        if (!character) return;

        drawDebugHud(guiCanvas, {
            width: W,
            height: H,
            font: '12px Poppins, sans-serif',
            lines: [
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
            ],
        });
    }

    function drawGround(ctx: CanvasRenderingContext2D) {
        const tile = 48;

        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#f1f5f9');
        grad.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        for (let ty = 0; ty < H + tile; ty += tile) {
            for (let tx = 0; tx < W + tile; tx += tile) {
                const even = ((tx / tile) + (ty / tile)) % 2 === 0;
                ctx.fillStyle = even ? 'rgba(255, 255, 255, 0.35)' : 'rgba(148, 163, 184, 0.08)';
                ctx.fillRect(tx, ty, tile, tile);
            }
        }

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
        ctx.lineWidth = 1;
        for (let gx = 0; gx <= W; gx += tile) {
            ctx.beginPath();
            ctx.moveTo(gx, 0);
            ctx.lineTo(gx, H);
            ctx.stroke();
        }
        for (let gy = 0; gy <= H; gy += tile) {
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(W, gy);
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
        if (canvas) {
            canvas.width = W;
            canvas.height = H;
        }
        character = createCharacter('mage', W / 2, H / 2);
        lastTime = performance.now();
        frameId = requestAnimationFrame(loop);
        window.addEventListener('keydown', onKeydown);
        window.addEventListener('keyup', onKeyup);

        loadCharacterSprites('mage').then((loaded) => {
            sprites = loaded;
        });

        return () => {
            if (frameId) cancelAnimationFrame(frameId);
            window.removeEventListener('keydown', onKeydown);
            window.removeEventListener('keyup', onKeyup);
        }
    });
</script>

<h1 class="text-6xl my-4 text-center">
    Character Debug
</h1>

<div class="debug-stage rounded-md overflow-hidden border border-(--border-color)">
    <div
        class="flex flex-col justify-between gap-2 p-4 w-64 border-r border-(--border-color) h-full"
    >
        <div class="flex flex-col gap-2">
            <h3 class="text-lg font-bold mb-2">Character</h3>
            <div class="flex flex-wrap gap-2">
                {#each characterClasses as cc}
                    <button
                        class="px-3 py-1 rounded-md text-sm transition-colors duration-200 {character?.type === cc.type ? 'bg-(--theme-color-600) text-white' : 'bg-gray-200 hover:bg-gray-300'}"
                        onclick={() => switchCharacter(cc.type)}
                    >
                        {cc.label}
                    </button>
                {/each}
            </div>
            <p class="text-sm text-gray-500">Active: {character?.type ?? '—'}</p>
        </div>
        <hr class="h-px">
        <div class="flex flex-col gap-2">
            <button class="bg-(--theme-color-600) text-white px-4 py-2 rounded-md hover:bg-(--theme-color-700) transition-colors duration-200" onclick={takeDamage}>Take Damage (-1 life)</button>
            <button class="bg-(--theme-color-600) text-white px-4 py-2 rounded-md hover:bg-(--theme-color-700) transition-colors duration-200" onclick={healFull}>Full Heal</button>
            <button class="bg-(--theme-color-600) text-white px-4 py-2 rounded-md hover:bg-(--theme-color-700) transition-colors duration-200" onclick={() => resetCharacter()}>Reset</button>
        </div>
    </div>
    <GameCanvasFrame width={W} height={H} bind:canvas bind:guiCanvas />
    <div
        class="flex flex-col justify-between gap-2 w-64 border-l border-(--border-color)"
    >
        <div class="flex flex-col gap-2 p-4">
            <h3 class="text-lg font-bold mb-2">Controls</h3>
            <p class="text-sm text-gray-500">WASD/Arrows: Move</p>
            <p class="text-sm text-gray-500">Shift: Sprint (2x speed)</p>
            <p class="text-sm text-gray-500">Render: shadow + sprite (dashed ring = hitbox, blue = range)</p>
        </div>
        <hr class="h-px">
        <div class="flex flex-col gap-2 p-4">
            <h3 class="text-lg font-bold mb-2">Stats</h3>
            {#if character}
                {@const config = characterConfig(character)}
                <p class="text-sm text-gray-500">Type: {character.type}</p>
                <p class="text-sm text-gray-500">Max Lives: {config.maxLives}</p>
                <p class="text-sm text-gray-500">Speed: {config.speed} px/s</p>
                <p class="text-sm text-gray-500">
                    Active ({character.inventory.getActiveCount()}/4):
                    {character.inventory.getActiveItems().map((item) => item.name).join(', ') || '—'}
                </p>
                <p class="text-sm text-gray-500">
                    Passive ({character.inventory.getPassiveCount()}/4):
                    {character.inventory.getPassiveItems().map((item) => item.name).join(', ') || '—'}
                </p>
                <p class="text-sm text-gray-500">Max range: {character.attackStats.range}px</p>
                <p class="text-sm text-gray-500">Damage: {character.attackStats.projectileDamage}</p>
                <p class="text-sm text-gray-500">Invuln: {config.invincibleFrames}ms</p>
            {/if}
        </div>
    </div>
</div>


