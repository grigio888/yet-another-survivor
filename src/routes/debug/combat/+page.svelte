<script lang="ts">
    import { Mage, CHARACTER_STATS, type Character } from '$lib/game/entities/characters';
    import type { Enemy } from '$lib/game/entities/enemies';
    import { ENEMIES, CANVAS, WAVES } from '$lib/game/config';
    import {
        loadCharacterSprites,
        snapEightDirection,
        type CharacterSpriteSet,
        type FacingDirection,
    } from '$lib/game/rendering/characterSprites';
    import { drawArenaEntities } from '$lib/game/rendering/arenaRender';
    import {
        drawProjectiles,
        loadProjectileSprites,
        type ProjectileSpriteSet,
    } from '$lib/game/rendering/projectileSprites';
    import { getProjectileSpriteUrls } from '$lib/game/items';
    import { separateEntities } from '$lib/game/systems/collision';
    import type { Projectile } from '$lib/game/systems/collision';
    import { processCombat } from '$lib/game/systems/combat';
    import type { CombatStats } from '$lib/game/systems/combat';
    import { SpawningSystem, type EnemyType } from '$lib/game/systems/spawning';
    import GameCanvasFrame from '$lib/components/GameCanvasFrame.svelte';
    import CharacterItemLoadout from '$lib/components/CharacterItemLoadout.svelte';
    import { drawDebugHud } from '$lib/game/rendering/debugHud';

    const spawning = new SpawningSystem();

    let canvas: HTMLCanvasElement | null = $state(null);
    let guiCanvas: HTMLCanvasElement | null = $state(null);
    let character: Character | null = $state(null);
    let sprites = $state<CharacterSpriteSet | null>(null);
    let projectileSprites = $state<ProjectileSpriteSet | null>(null);
    let playerProjectiles = $state<Projectile[]>([]);
    let enemyProjectiles = $state<Projectile[]>([]);
    let frameId = $state(0);
    let lastTime = $state(0);
    let keys = $state(new Set<string>());
    let movement = $state({ dx: 0, dy: 0, sprint: false });
    let invincible = $state(false);
    let timeAlive = $state(0);
    let stats = $state<CombatStats>(createStats());
    let facing = $state<FacingDirection>({ dx: 0, dy: 1 });
    let wavesActive = $state(false);
    let waveSpawned = $state(0);
    let waveQuota = $state(WAVES.initialEnemies);
    let aliveEnemies = $state(0);
    let combatLog = $state<string[]>([]);

    const enemyTypes: { label: string; type: EnemyType }[] = [
        { label: 'Grunt', type: 'grunt' },
        { label: 'Shooter', type: 'shooter' },
        { label: 'Chief', type: 'chief' },
    ];

    const COMBAT_TICK_DT = 1 / 60;

    const W = CANVAS.width;
    const H = CANVAS.height;
    const PROJECTILE_MARGIN = 50;

    function createStats(): CombatStats {
        return {
            score: 0,
            kills: 0,
            wave: 1,
            combo: 0,
            lastKillTime: Date.now(),
            timeSurvived: 0,
        };
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

    function updateFacingTowardTarget(target: Enemy) {
        facing = snapEightDirection(target.x - character!.x, target.y - character!.y);
    }

    function applyCombatResult(result: ReturnType<typeof processCombat>) {
        playerProjectiles = playerProjectiles.filter(
            (p, i) => !result.combat.projectilesToRemove.has(i) && !offscreen(p)
        );
        enemyProjectiles = enemyProjectiles.filter(
            (p, i) => !result.combat.enemyProjectilesToRemove.has(i) && !offscreen(p)
        );
        spawning.pruneDeadEnemies();
        return result;
    }

    function addEnemy(type: EnemyType) {
        spawning.spawnManualEnemy(type);
        syncWaveHud();
    }

    function triggerCombat() {
        if (!character) return;

        const log: string[] = [];
        const prevLives = character.lives;
        const prevScore = stats.score;
        const enemies = spawning.getEnemyList();

        log.push(`Resolving combat: ${enemies.length} enemies, ${playerProjectiles.length} player bolts, ${enemyProjectiles.length} enemy bolts`);

        const result = applyCombatResult(
            processCombat(playerProjectiles, enemyProjectiles, enemies, character, stats, COMBAT_TICK_DT)
        );

        if (result.combat.kills.length > 0) {
            for (const kill of result.combat.kills) {
                log.push(`Kill: ${kill.enemyType} (+${kill.scoreValue} base)`);
            }
        } else {
            log.push('Kill: none');
        }

        log.push(`Score gained: +${result.combat.scoreGained} (total ${stats.score})`);
        log.push(`Combo: ${stats.combo}`);

        if (result.characterHit) {
            log.push(`Player hit: ${result.characterDamage} damage`);
            log.push(`Lives: ${prevLives} → ${character.lives}`);
        } else {
            log.push('Player hit: none');
        }

        log.push(
            `Removed projectiles: ${result.combat.projectilesToRemove.size} player, ${result.combat.enemyProjectilesToRemove.size} enemy`
        );
        log.push(`Enemies alive: ${spawning.getAliveCount()}`);

        if (stats.score > prevScore) {
            log.push('Scoring updated.');
        }

        combatLog = log;
        invincible = character.isInvincible();
        syncWaveHud();
    }

    function startWaves() {
        spawning.startGame({ x: W / 2, y: H / 2 });
        wavesActive = true;
        syncWaveHud();
    }

    function stopWaves() {
        spawning.endGame();
        wavesActive = false;
        syncWaveHud();
    }

    function resetAll() {
        playerProjectiles = [];
        enemyProjectiles = [];
        if (character) {
            character.x = W / 2;
            character.y = H / 2;
            character.hp = character.maxHp;
            character.lives = CHARACTER_STATS[character.type as keyof typeof CHARACTER_STATS].maxLives;
            character.invincibleUntil = 0;
        }
        stats = createStats();
        timeAlive = 0;
        combatLog = [];
        startWaves();
    }

    function syncWaveHud() {
        stats.wave = spawning.getWave();
        waveSpawned = spawning.getSpawnedThisWave();
        waveQuota = spawning.getWaveQuota();
        aliveEnemies = spawning.getAliveCount();
    }

    function nearestEnemyInRange(enemies: Enemy[]): Enemy | null {
        if (!character) return null;
        return character.findNearestInRange(enemies.filter((e) => e.isAlive()));
    }

    function offscreen(p: Projectile): boolean {
        return (
            p.x < -PROJECTILE_MARGIN ||
            p.x > W + PROJECTILE_MARGIN ||
            p.y < -PROJECTILE_MARGIN ||
            p.y > H + PROJECTILE_MARGIN
        );
    }

    function loop(now: number) {
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        timeAlive += dt;

        if (!character) {
            frameId = requestAnimationFrame(loop);
            return;
        }

        if (wavesActive) {
            const spawnResult = spawning.update(dt);
            if (spawnResult.waveEnded) {
                syncWaveHud();
            }
        }

        const enemies = spawning.getEnemyList();

        const canShoot = character.update(dt, movement);
        character.x = Math.max(character.size / 2, Math.min(W - character.size / 2, character.x));
        character.y = Math.max(character.size / 2, Math.min(H - character.size / 2, character.y));
        invincible = character.isInvincible();

        if (canShoot) {
            const target = nearestEnemyInRange(enemies);
            if (target) {
                if (movement.dx === 0 && movement.dy === 0) {
                    updateFacingTowardTarget(target);
                }
                const projs = character.shoot(target);
                if (projs.length > 0) playerProjectiles.push(...projs);
            }
        }

        const { projectiles } = spawning.updateAllEnemies(dt, character.x, character.y);
        enemyProjectiles.push(...projectiles);

        separateEntities(enemies, 2);

        for (const p of playerProjectiles) {
            p.x += p.direction.dx * p.speed * dt;
            p.y += p.direction.dy * p.speed * dt;
        }
        for (const p of enemyProjectiles) {
            p.x += p.direction.dx * p.speed * dt;
            p.y += p.direction.dy * p.speed * dt;
        }

        applyCombatResult(
            processCombat(playerProjectiles, enemyProjectiles, enemies, character, stats, dt)
        );

        syncWaveHud();
        draw(enemies);
        drawGui(enemies);
        frameId = requestAnimationFrame(loop);
    }

    function drawGui(enemies: Enemy[]) {
        drawDebugHud(guiCanvas, {
            width: W,
            height: H,
            lines: [
                `time: ${timeAlive.toFixed(1)}s`,
                `wave: ${stats.wave}`,
                `enemies: ${enemies.length}`,
                `player projectiles: ${playerProjectiles.length}`,
                `enemy projectiles: ${enemyProjectiles.length}`,
                ...(character ? [`player lives: ${character.lives}`] : []),
                `score: ${stats.score}`,
                `kills: ${stats.kills}`,
                `combo: ${stats.combo}`,
            ],
        });
    }

    function draw(enemies: Enemy[]) {
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        ctx.lineWidth = 1;
        for (let gx = 0; gx < W; gx += 50) {
            ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
        }
        for (let gy = 0; gy < H; gy += 50) {
            ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
        }

        drawArenaEntities(ctx, character, facing, sprites, enemies, {
            showRange: true,
            showHitbox: true,
            characterInvincible: invincible,
        });

        drawProjectiles(ctx, playerProjectiles, projectileSprites);

        ctx.fillStyle = '#f97316';
        for (const p of enemyProjectiles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    $effect(() => {
        if (canvas) {
            canvas.width = W;
            canvas.height = H;
        }

        character = new Mage(W / 2, H / 2);
        lastTime = performance.now();
        startWaves();
        frameId = requestAnimationFrame(loop);
        window.addEventListener('keydown', onKeydown);
        window.addEventListener('keyup', onKeyup);

        loadCharacterSprites('mage').then((loaded) => {
            sprites = loaded;
        });

        loadProjectileSprites(getProjectileSpriteUrls()).then((loaded) => {
            projectileSprites = loaded;
        });

        return () => {
            if (frameId) cancelAnimationFrame(frameId);
            window.removeEventListener('keydown', onKeydown);
            window.removeEventListener('keyup', onKeyup);
            spawning.endGame();
        };
    });
</script>

<h1 class="text-6xl my-4 text-center">Combat Debug</h1>

<div class="debug-stage rounded-md overflow-hidden border border-(--border-color)">
    <div class="flex flex-col justify-between gap-2 p-4 w-96 border-r border-(--border-color) h-full">
        <div class="flex flex-col gap-2">
            <h3 class="text-lg font-bold mb-2">Waves</h3>
            <p class="text-sm text-gray-500">
                Automatic spawning via <code class="text-xs">SpawningSystem</code> — types, timing,
                and positions follow wave config.
            </p>
            <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-500">
                <span>Status</span>
                <span class="text-right text-(--text-color)">{wavesActive ? 'Running' : 'Stopped'}</span>
                <span>Wave</span><span class="text-right text-(--text-color)">{stats.wave}</span>
                <span>Spawned</span><span class="text-right text-(--text-color)">{waveSpawned} / {waveQuota}</span>
                <span>Alive</span><span class="text-right text-(--text-color)">{aliveEnemies}</span>
            </div>
            <div class="flex flex-wrap gap-2">
                <button
                    class="bg-(--theme-color-600) text-white px-4 py-2 rounded-md hover:bg-(--theme-color-700) transition-colors duration-200"
                    onclick={startWaves}
                    disabled={wavesActive}
                >
                    Start Waves
                </button>
                <button
                    class="bg-(--background-color) border border-(--border-color) text-white px-4 py-2 rounded-md hover:bg-(--theme-color-600) transition-colors duration-200"
                    onclick={stopWaves}
                    disabled={!wavesActive}
                >
                    Stop Waves
                </button>
                <button
                    class="bg-(--theme-color-600) text-white px-4 py-2 rounded-md hover:bg-(--theme-color-700) transition-colors duration-200"
                    onclick={resetAll}
                >
                    Reset All
                </button>
            </div>
        </div>
        <hr class="h-px">
        <div class="flex flex-col gap-2">
            <h3 class="text-lg font-bold mb-2">Combat</h3>
            <button
                class="bg-(--theme-color-600) text-white px-4 py-2 rounded-md hover:bg-(--theme-color-700) transition-colors duration-200"
                onclick={triggerCombat}
            >
                Resolve Combat
            </button>
            <p class="text-sm text-gray-500">
                Runs <code class="text-xs">processCombat</code> once on the current arena state
                (projectiles, enemies, player) with no scripted setup.
            </p>
            {#if combatLog.length > 0}
                <ul class="text-xs text-gray-500 space-y-1 font-mono bg-(--background-color) border border-(--border-color) rounded-md p-2">
                    {#each combatLog as line}
                        <li>{line}</li>
                    {/each}
                </ul>
            {/if}
        </div>
        <hr class="h-px">
        <h3 class="text-lg font-bold mb-2">Wave Config</h3>
        <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-500">
            <span>Initial enemies</span><span class="text-right text-(--text-color)">{WAVES.initialEnemies}</span>
            <span>+ per wave</span><span class="text-right text-(--text-color)">{WAVES.increasePerWave}</span>
            <span>Spawn interval</span><span class="text-right text-(--text-color)">{WAVES.spawnInterval}ms</span>
            <span>Wave duration</span><span class="text-right text-(--text-color)">{WAVES.waveInterval}ms</span>
            <span>Spawn margin</span><span class="text-right text-(--text-color)">{WAVES.spawnMargin}px</span>
        </div>
    </div>
    <div class="relative flex min-w-0 flex-1 items-center justify-center">
        <GameCanvasFrame width={W} height={H} bind:canvas bind:guiCanvas />
        {#if character}
            <CharacterItemLoadout
                inventory={character.inventory}
                class="absolute top-3 left-3 z-10 pointer-events-none"
                showLabels={false}
            />
        {/if}
    </div>
    <div class="flex flex-col justify-between gap-2 p-4 w-96 border-l border-(--border-color)">
        <div class="flex flex-col gap-2">
            <h3 class="text-lg font-bold mb-2">Manual Spawn</h3>
            <p class="text-sm text-gray-500">
                Spawn enemies off-screen via <code class="text-xs">spawnEnemy</code> — same rules as waves.
            </p>
            {#each enemyTypes as ec}
                <button
                    class="bg-(--background-color) border border-(--border-color) text-white
                    px-4 py-2 rounded-md hover:bg-(--theme-color-600) transition-colors duration-200
                    cursor-pointer"
                    onclick={() => addEnemy(ec.type)}
                >
                    {ec.label}
                </button>
            {/each}
        </div>
        <hr class="h-px">
        <div class="flex flex-col gap-2">
            <h3 class="text-lg font-bold mb-2">Controls</h3>
            <p class="text-sm text-gray-500">WASD / Arrows: Move</p>
            <p class="text-sm text-gray-500">Shift: Sprint</p>
            <p class="text-sm text-gray-500">Auto-fire at nearest enemy in range</p>
        </div>
        <hr class="h-px">
        <h3 class="text-lg font-bold mb-2">Wave Config</h3>
        <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-500">
            <span>Initial enemies</span><span class="text-right text-(--text-color)">{WAVES.initialEnemies}</span>
            <span>+ per wave</span><span class="text-right text-(--text-color)">{WAVES.increasePerWave}</span>
            <span>Spawn interval</span><span class="text-right text-(--text-color)">{WAVES.spawnInterval}ms</span>
            <span>Wave duration</span><span class="text-right text-(--text-color)">{WAVES.waveInterval}ms</span>
            <span>Spawn margin</span><span class="text-right text-(--text-color)">{WAVES.spawnMargin}px</span>
        </div>
        <hr class="h-px">
        <h3 class="text-lg font-bold mb-2">Enemy Stats</h3>
        <table class="w-full text-sm">
            <thead><tr><th>Type</th><th>HP</th><th>Speed</th><th>Dmg</th><th>Range</th></tr></thead>
            <tbody>
                <tr><td>Grunt</td><td>{ENEMIES.grunt.hp}</td><td>{ENEMIES.grunt.speed}</td><td>{ENEMIES.grunt.damage}</td><td>Melee</td></tr>
                <tr><td>Shooter</td><td>{ENEMIES.shooter.hp}</td><td>{ENEMIES.shooter.speed}</td><td>{ENEMIES.shooter.damage}</td><td>{ENEMIES.shooter.range}px</td></tr>
                <tr><td>Chief</td><td>{ENEMIES.chief.hp}</td><td>{ENEMIES.chief.speed}</td><td>{ENEMIES.chief.damage}</td><td>Melee</td></tr>
            </tbody>
        </table>
        <hr class="h-px">
        <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-500">
            <span>Score</span><span class="text-right text-(--text-color)">{stats.score}</span>
            <span>Kills</span><span class="text-right text-(--text-color)">{stats.kills}</span>
            <span>Combo</span><span class="text-right text-(--text-color)">{stats.combo}</span>
            <span>Lives</span><span class="text-right text-(--text-color)">{character?.lives ?? 0}</span>
            <span>Time</span><span class="text-right text-(--text-color)">{timeAlive.toFixed(1)}s</span>
        </div>
    </div>
</div>
