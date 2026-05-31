<script lang="ts">
    import { Mage, CHARACTER_STATS, type Character } from '$lib/game/entities/characters';
    import type { Enemy, EnemySpriteType } from '$lib/game/entities/enemies';
    import { CANVAS, WAVES } from '$lib/game/config';
    import { SHOOTER_STATS, CHIEF_STATS, JELLY_STATS, GOBLIN_ARCHER_STATS } from '$lib/game/entities/enemies';
    import {
        loadCharacterSprites,
        type CharacterSpriteSet,
    } from '$lib/game/rendering/characterSprites';
    import { drawArenaEntities } from '$lib/game/rendering/arenaRender';
    import {
        loadAllEnemySprites,
        type EnemySpriteLibrary,
    } from '$lib/game/rendering/enemySprites';
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
    import { HitKnockback } from '$lib/game/systems/knockback';
    import { clampShadowCenter, getEntityAnchorPoint } from '$lib/game/rendering/shadow';
    import { ENEMY_HP_BAR_OFFSET } from '$lib/game/systems/arenaBounds';
    import { SpawningSystem, type EnemyType } from '$lib/game/systems/spawning';
    import { GamePolish } from '$lib/game/polish';
    import GameCanvasFrame from '$lib/components/GameCanvasFrame.svelte';
    import DebugPlayground from '$lib/components/DebugPlayground.svelte';
    import CharacterItemLoadout from '$lib/components/CharacterItemLoadout.svelte';
    import DebugHud from '$lib/components/DebugHud.svelte';
    import { RoButton, RoWindow } from '$lib/components/ui';

    const spawning = new SpawningSystem();
    const polish = new GamePolish();
    const hitKnockback = new HitKnockback();

    let canvas: HTMLCanvasElement | null = $state(null);
    let character: Character | null = $state(null);
    let sprites = $state<CharacterSpriteSet | null>(null);
    let enemySprites = $state<Partial<Record<EnemySpriteType, EnemySpriteLibrary>> | null>(null);
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
    let wavesActive = $state(false);
    let waveSpawned = $state(0);
    let waveQuota = $state(WAVES.initialEnemies);
    let aliveEnemies = $state(0);
    let combatLog = $state<string[]>([]);
    let flashAlpha = $state(0);
    let fadeAlpha = $state(0);
    let gameOverPolishPlayed = false;

    const enemyTypes: { label: string; type: EnemyType }[] = [
        { label: 'Jelly', type: 'jelly' },
        { label: 'Goblin Archer', type: 'goblinArcher' },
        { label: 'Shooter', type: 'shooter' },
        { label: 'Chief', type: 'chief' },
    ];

    const COMBAT_TICK_DT = 1 / 60;
    const PROJECTILE_MARGIN = 50;

    let arenaWidth = $state(CANVAS.width);
    let arenaHeight = $state(CANVAS.height);
    let hudLines = $state<string[]>([]);

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

        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
            dx /= len;
            dy /= len;
        }
        movement = { dx, dy, sprint };
    }

    function updateFacingTowardTarget(target: Enemy) {
        character!.faceToward(target.x - character!.x, target.y - character!.y);
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
            log.push(`Player hit: ${result.characterDamage} damage${result.characterDamaged ? '' : ' (blocked)'}`);
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
        polish.onCombatResult(result, enemies, character);

        if (result.characterDamaged) {
            hitKnockback.trigger(
                getEntityAnchorPoint(character).x,
                getEntityAnchorPoint(character).y,
                character.range,
                enemies,
            );
            hitKnockback.apply(enemies, COMBAT_TICK_DT, arenaWidth, arenaHeight);
        }

        syncWaveHud();
        draw(enemies);
    }

    function startWaves() {
        spawning.startGame({ x: arenaWidth / 2, y: arenaHeight / 2 });
        wavesActive = true;
        polish.onGameStart();
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
            character.x = arenaWidth / 2;
            character.y = arenaHeight / 2;
            character.hp = character.maxHp;
            character.lives = CHARACTER_STATS[character.type as keyof typeof CHARACTER_STATS].maxLives;
            character.invincibleUntil = 0;
        }
        stats = createStats();
        timeAlive = 0;
        combatLog = [];
        gameOverPolishPlayed = false;
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
            p.x > arenaWidth + PROJECTILE_MARGIN ||
            p.y < -PROJECTILE_MARGIN ||
            p.y > arenaHeight + PROJECTILE_MARGIN
        );
    }

    function loop(now: number) {
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        timeAlive += dt;

        if (!character) {
            polish.update(dt);
            flashAlpha = polish.effects.flashAlpha;
            fadeAlpha = polish.effects.fadeAlpha;
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

        hitKnockback.apply(enemies, dt, arenaWidth, arenaHeight);

        const canShoot = character.update(dt, movement);
        clampShadowCenter(character, arenaWidth, arenaHeight, ENEMY_HP_BAR_OFFSET);
        invincible = character.isInvincible();

        if (canShoot) {
            const target = nearestEnemyInRange(enemies);
            if (target) {
                if (movement.dx === 0 && movement.dy === 0) {
                    updateFacingTowardTarget(target);
                }
                const projs = character.shoot(target);
                if (projs.length > 0) {
                    playerProjectiles.push(...projs);
                    polish.onShoot();
                }
            }
        }

        const playerAnchor = getEntityAnchorPoint(character);
        const { projectiles } = spawning.updateAllEnemies(dt, playerAnchor.x, playerAnchor.y);
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

        const combatResult = applyCombatResult(
            processCombat(playerProjectiles, enemyProjectiles, enemies, character, stats, dt)
        );
        polish.onCombatResult(combatResult, enemies, character);

        if (combatResult.characterDamaged) {
            hitKnockback.trigger(
                getEntityAnchorPoint(character).x,
                getEntityAnchorPoint(character).y,
                character.range,
                enemies,
            );
            hitKnockback.apply(enemies, dt, arenaWidth, arenaHeight);
        }

        if (character.lives <= 0 && !gameOverPolishPlayed) {
            polish.onGameOver();
            gameOverPolishPlayed = true;
        }

        polish.update(dt);
        flashAlpha = polish.effects.flashAlpha;
        fadeAlpha = polish.effects.fadeAlpha;

        syncWaveHud();
        draw(enemies);
        syncHud(enemies);
        frameId = requestAnimationFrame(loop);
    }

    function syncHud(enemies: Enemy[]) {
        hudLines = [
            `time: ${timeAlive.toFixed(1)}s`,
            `wave: ${stats.wave}`,
            `enemies: ${enemies.length}`,
            `player projectiles: ${playerProjectiles.length}`,
            `enemy projectiles: ${enemyProjectiles.length}`,
            ...(character ? [`player lives: ${character.lives}`] : []),
            `score: ${stats.score}`,
            `kills: ${stats.kills}`,
            `combo: ${stats.combo}`,
        ];
    }

    function draw(enemies: Enemy[]) {
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, arenaWidth, arenaHeight);

        const shake = polish.effects.getShakeOffset();
        ctx.save();
        ctx.translate(shake.x, shake.y);

        ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        ctx.lineWidth = 1;
        for (let gx = 0; gx < arenaWidth; gx += 50) {
            ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, arenaHeight); ctx.stroke();
        }
        for (let gy = 0; gy < arenaHeight; gy += 50) {
            ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(arenaWidth, gy); ctx.stroke();
        }

        drawArenaEntities(ctx, character, sprites, enemies, {
            showRange: true,
            showHitbox: true,
            characterInvincible: invincible,
            enemySprites,
        });

        drawProjectiles(ctx, playerProjectiles, projectileSprites);

        ctx.fillStyle = '#f97316';
        for (const p of enemyProjectiles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        polish.particles.draw(ctx);
        ctx.restore();
    }

    $effect(() => {
        if (arenaWidth > 0 && arenaHeight > 0) {
            spawning.setArenaSize(arenaWidth, arenaHeight);
        }
    });

    $effect(() => {
        if (arenaWidth <= 0 || arenaHeight <= 0 || character) return;
        character = new Mage(arenaWidth / 2, arenaHeight / 2);
    });

    $effect(() => {
        lastTime = performance.now();
        startWaves();
        frameId = requestAnimationFrame(loop);
        window.addEventListener('keydown', onKeydown);
        window.addEventListener('keyup', onKeyup);

        loadCharacterSprites('mage').then((loaded) => {
            sprites = loaded;
        });

        loadAllEnemySprites().then((loaded) => {
            enemySprites = loaded;
        });

        loadProjectileSprites(getProjectileSpriteUrls()).then((loaded) => {
            projectileSprites = loaded;
        });

        return () => {
            if (frameId) cancelAnimationFrame(frameId);
            window.removeEventListener('keydown', onKeydown);
            window.removeEventListener('keyup', onKeyup);
            spawning.endGame();
            polish.destroy();
        };
    });
</script>

<DebugPlayground leftTitle="Battle Control" rightTitle="Spawn & Stats">
    {#snippet children()}
        <div class="relative h-full w-full">
            <GameCanvasFrame fill bind:width={arenaWidth} bind:height={arenaHeight} bind:canvas />
        </div>
    {/snippet}

    {#snippet overlays()}
        {#if flashAlpha > 0}
            <div
                class="pointer-events-none absolute inset-0 bg-red-300/70"
                style:opacity={flashAlpha}
                aria-hidden="true"
            ></div>
        {/if}
        {#if fadeAlpha > 0}
            <div
                class="pointer-events-none absolute inset-0 bg-[#0a1628]"
                style:opacity={fadeAlpha}
                aria-hidden="true"
            ></div>
        {/if}
        <div class="relative h-full w-full flex justify-center items-end">
            {#if character}
            <RoWindow
                title="Skills"
                class="w-70 mb-3"
                bodyClass="p-2"
            >
                <CharacterItemLoadout inventory={character.inventory} bare showLabels={false} />
            </RoWindow>
            {/if}
        </div>
    {/snippet}

    {#snippet left()}
        <div class="flex flex-col gap-2">
            <p class="text-sm ro-muted">
                Automatic spawning via <code class="text-xs">SpawningSystem</code> — types, timing,
                and positions follow wave config. Gray ellipse = shadow; cyan cross = sprite anchor;
                amber rectangle = enemy hitbox; amber rectangle = player hitbox.
            </p>
            <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm ro-muted">
                <span>Status</span>
                <span class="text-right ro-strong">{wavesActive ? 'Running' : 'Stopped'}</span>
                <span>Wave</span><span class="text-right ro-strong">{stats.wave}</span>
                <span>Spawned</span><span class="text-right ro-strong">{waveSpawned} / {waveQuota}</span>
                <span>Alive</span><span class="text-right ro-strong">{aliveEnemies}</span>
            </div>
            <div class="flex flex-wrap gap-2">
                <RoButton onclick={startWaves} disabled={wavesActive}>Start Waves</RoButton>
                <RoButton onclick={stopWaves} disabled={!wavesActive}>Stop Waves</RoButton>
                <RoButton onclick={resetAll}>Reset All</RoButton>
            </div>
        </div>
        <hr class="h-px border-[#a8c8f0]/60" />
        <div class="flex flex-col gap-2">
            <RoButton onclick={triggerCombat}>Resolve Combat</RoButton>
            <p class="text-sm ro-muted">
                Runs <code class="text-xs">processCombat</code> once on the current arena state.
            </p>
            {#if combatLog.length > 0}
                <ul class="ro-panel space-y-1 p-2 font-mono text-xs ro-muted">
                    {#each combatLog as line}
                        <li>{line}</li>
                    {/each}
                </ul>
            {/if}
        </div>
        <hr class="h-px border-[#a8c8f0]/60" />
        <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm ro-muted">
            <span>Initial enemies</span><span class="text-right ro-strong">{WAVES.initialEnemies}</span>
            <span>+ per wave</span><span class="text-right ro-strong">{WAVES.increasePerWave}</span>
            <span>Spawn interval</span><span class="text-right ro-strong">{WAVES.spawnInterval}ms</span>
            <span>Wave duration</span><span class="text-right ro-strong">{WAVES.waveInterval}ms</span>
            <span>Spawn margin</span><span class="text-right ro-strong">{WAVES.spawnMargin}px</span>
        </div>
    {/snippet}

    {#snippet right()}
        <div class="flex flex-col gap-2">
            <p class="text-sm ro-muted">
                Spawn enemies off-screen via <code class="text-xs">spawnEnemy</code>.
            </p>
            {#each enemyTypes as ec}
                <RoButton onclick={() => addEnemy(ec.type)}>{ec.label}</RoButton>
            {/each}
        </div>
        <hr class="h-px border-[#a8c8f0]/60" />
        <div class="flex flex-col gap-2">
            <p class="text-sm ro-muted">WASD / Arrows: Move</p>
            <p class="text-sm ro-muted">Shift: Sprint</p>
            <p class="text-sm ro-muted">Auto-fire at nearest enemy in range</p>
        </div>
        <hr class="h-px border-[#a8c8f0]/60" />
        <table class="w-full text-sm ro-muted">
            <thead><tr><th>Type</th><th>HP</th><th>Speed</th><th>Dmg</th><th>Range</th></tr></thead>
            <tbody>
                <tr><td>Jelly</td><td>{JELLY_STATS.hp}</td><td>{JELLY_STATS.speed}</td><td>{JELLY_STATS.damage}</td><td>Melee</td></tr>
                <tr><td>Goblin Archer</td><td>{GOBLIN_ARCHER_STATS.hp}</td><td>{GOBLIN_ARCHER_STATS.speed}</td><td>{GOBLIN_ARCHER_STATS.damage}</td><td>{GOBLIN_ARCHER_STATS.range}px</td></tr>
                <tr><td>Shooter</td><td>{SHOOTER_STATS.hp}</td><td>{SHOOTER_STATS.speed}</td><td>{SHOOTER_STATS.damage}</td><td>{SHOOTER_STATS.range}px</td></tr>
                <tr><td>Chief</td><td>{CHIEF_STATS.hp}</td><td>{CHIEF_STATS.speed}</td><td>{CHIEF_STATS.damage}</td><td>Melee</td></tr>
            </tbody>
        </table>
        <hr class="h-px border-[#a8c8f0]/60" />
        <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm ro-muted">
            <span>Score</span><span class="text-right ro-strong">{stats.score}</span>
            <span>Kills</span><span class="text-right ro-strong">{stats.kills}</span>
            <span>Combo</span><span class="text-right ro-strong">{stats.combo}</span>
            <span>Lives</span><span class="text-right ro-strong">{character?.lives ?? 0}</span>
            <span>Time</span><span class="text-right ro-strong">{timeAlive.toFixed(1)}s</span>
        </div>
    {/snippet}
</DebugPlayground>
