<script lang="ts">
    import { browser } from '$app/environment';
    import { CANVAS } from '$lib/game/config';
    import { SurvivorSession, createInitialStats } from '$lib/game/engine';
    import { InputManager } from '$lib/game/input/manager';
    import { buildGameOverSummary, type GamePhase } from '$lib/game/screens';
    import type { CombatStats } from '$lib/game/systems/combat';
    import {
        loadCharacterSprites,
        type CharacterSpriteSet,
    } from '$lib/game/rendering/characterSprites';
    import {
        type ProjectileSpriteSet,
    } from '$lib/game/rendering/projectileSprites';
    import {
        loadAllEnemySprites,
        type EnemySpriteLibrary,
    } from '$lib/game/rendering/enemySprites';
    import type { EnemySpriteType } from '$lib/game/entities/enemies';
    import { getItemVisualUrls } from '$lib/game/items';
    import { loadItemVisualLibrary, type ItemVisualLibrary } from '$lib/game/rendering/itemSprites';
    import GameCanvasFrame from '$lib/components/GameCanvasFrame.svelte';
    import CharacterItemLoadout from '$lib/components/CharacterItemLoadout.svelte';
    import {
        GameHud,
        GameOverScreen,
        MenuScreen,
        PauseScreen,
    } from '$lib/components/game';
    import { RoWindow } from '$lib/components/ui';

    const session = new SurvivorSession();
    const input = new InputManager();

    let canvas: HTMLCanvasElement | null = $state(null);
    let arenaWidth = $state(CANVAS.width);
    let arenaHeight = $state(CANVAS.height);
    let phase = $state<GamePhase>('menu');
    let stats = $state<CombatStats>(createInitialStats());
    let wave = $state(1);
    let lives = $state(0);
    let timeAlive = $state(0);
    let character = $state(session.character);
    let sprites = $state<CharacterSpriteSet | null>(null);
    let enemySprites = $state<Partial<Record<EnemySpriteType, EnemySpriteLibrary>> | null>(null);
    let projectileSprites = $state<ProjectileSpriteSet | null>(null);

    let frameId = 0;
    let lastTime = 0;
    let pauseLatch = false;
    let flashAlpha = $state(0);
    let fadeAlpha = $state(0);

    const gameOverSummary = $derived(buildGameOverSummary(stats, timeAlive));

    function syncFromSession() {
        const snapshot = session.getSnapshot();
        phase = snapshot.phase;
        stats = snapshot.stats;
        wave = snapshot.wave;
        lives = snapshot.lives;
        timeAlive = snapshot.timeAlive;
        character = snapshot.character;
    }

    function startGame() {
        session.startGame();
        syncFromSession();
    }

    function returnToMenu() {
        session.returnToMenu();
        syncFromSession();
    }

    function resumeGame() {
        if (session.phase === 'paused') {
            session.togglePause();
            syncFromSession();
        }
    }

    function loop(now: number) {
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;

        if (input.isPausePressed()) {
            if (!pauseLatch && (session.phase === 'playing' || session.phase === 'paused')) {
                session.togglePause();
            }
            pauseLatch = true;
        } else {
            pauseLatch = false;
        }

        if (session.phase === 'playing') {
            session.tick(dt, input.getMovementVector());
        }

        session.updatePolish(dt);

        const ctx = canvas?.getContext('2d');
        if (ctx) {
            session.draw(ctx, sprites, projectileSprites, enemySprites, projectileSprites);
        }
        flashAlpha = session.polish.effects.flashAlpha;
        fadeAlpha = session.polish.effects.fadeAlpha;
        syncFromSession();

        frameId = requestAnimationFrame(loop);
    }

    function drawIdleArena() {
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;
        session.draw(ctx, sprites, projectileSprites, enemySprites, projectileSprites);
    }

    $effect(() => {
        if (!browser) return;
        session.setArenaSize(arenaWidth, arenaHeight);
        if (session.phase === 'menu') {
            drawIdleArena();
        }
    });

    $effect(() => {
        if (!browser) return;

        lastTime = performance.now();
        frameId = requestAnimationFrame(loop);

        loadCharacterSprites('mage').then((loaded) => {
            sprites = loaded;
        });

        loadAllEnemySprites().then((loaded) => {
            enemySprites = loaded;
        });

        loadItemVisualLibrary(getItemVisualUrls()).then((loaded) => {
            projectileSprites = loaded;
        });

        return () => {
            if (frameId) cancelAnimationFrame(frameId);
            input.destroy();
            session.destroy();
        };
    });
</script>

<div class="relative h-dvh min-h-0 w-full overflow-hidden bg-(--bg-color-900)">
    <GameCanvasFrame fill bind:width={arenaWidth} bind:height={arenaHeight} bind:canvas />

    {#if flashAlpha > 0}
        <div
            class="pointer-events-none absolute inset-0 z-40 bg-red-300/70"
            style:opacity={flashAlpha}
            aria-hidden="true"
        ></div>
    {/if}

    {#if fadeAlpha > 0}
        <div
            class="pointer-events-none absolute inset-0 z-40 bg-[#0a1628]"
            style:opacity={fadeAlpha}
            aria-hidden="true"
        ></div>
    {/if}

    {#if phase === 'playing'}
        <div class="pointer-events-none absolute inset-0">
            <GameHud
                {wave}
                score={stats.score}
                kills={stats.kills}
                {lives}
                {timeAlive}
            />
            {#if character}
                <div class="absolute inset-x-0 bottom-3 flex justify-center">
                    <RoWindow title="Skills" class="w-70" bodyClass="p-2">
                        <CharacterItemLoadout inventory={character.inventory} bare showLabels={false} />
                    </RoWindow>
                </div>
            {/if}
        </div>
    {/if}

    {#if phase === 'menu'}
        <MenuScreen onStart={startGame} />
    {/if}

    {#if phase === 'paused'}
        <PauseScreen onResume={resumeGame} onMenu={returnToMenu} />
    {/if}

    {#if phase === 'gameover'}
        <GameOverScreen summary={gameOverSummary} onRestart={startGame} onMenu={returnToMenu} />
    {/if}
</div>
