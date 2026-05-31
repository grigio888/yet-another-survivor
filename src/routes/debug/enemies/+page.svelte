<script lang="ts">
    import {
        ENEMY_CATALOG,
        enemyHasSpriteArt,
        enemyProjectileSpeed,
        enemyShoots,
        getEnemySpriteConfig,
        getEnemyStats,
        type EnemySpriteType,
    } from '$lib/game/entities/enemies';
    import { CANVAS } from '$lib/game/config';
    import {
        ANIMATION_STATES,
        DEFAULT_ANIMATION_FPS,
        getClipFrameCount,
        resolveAnimationConfig,
        type AnimationState,
    } from '$lib/game/animation';
    import { createEnemy, type EnemyType } from '$lib/game/systems/spawning';
    import type { Enemy } from '$lib/game/entities/enemies';
    import type { Projectile } from '$lib/game/systems/collision';
    import {
        advancePreviewFrame,
        drawAnimatedSpriteAtState,
        drawEntityFallback,
        getPreviewClipFps,
    } from '$lib/game/rendering/entitySprites';
    import {
        loadAllEnemySprites,
        type EnemySpriteLibrary,
    } from '$lib/game/rendering/enemySprites';
    import {
        drawProjectile,
        loadProjectileSprites,
        type ProjectileSpriteSet,
    } from '$lib/game/rendering/projectileSprites';
    import { drawShadowOutline, drawSpriteAnchorMarker } from '$lib/game/rendering/shadow';
    import { drawHitboxOutline } from '$lib/game/rendering/hitboxRender';
    import { withLiveHitbox } from '$lib/game/systems/hitbox';
    import {
        facingToSpriteKey,
        snapEightDirection,
        type FacingDirection,
    } from '$lib/game/rendering/characterSprites';
    import GameCanvasFrame from '$lib/components/GameCanvasFrame.svelte';
    import DebugPlayground from '$lib/components/DebugPlayground.svelte';
    import { RoButton, RoWindow } from '$lib/components/ui';
    import {
        facingFromKey,
        loadEnemyInspectorSettings,
        saveEnemyInspectorSettings,
    } from '$lib/debug/enemyInspectorStorage';

    const savedSettings =
        typeof localStorage !== 'undefined' ? loadEnemyInspectorSettings() : loadEnemyInspectorSettings({
            getItem: () => null,
        });

    const FACING_OPTIONS: { label: string; facing: FacingDirection }[] = [
        { label: 'SW', facing: { dx: -1, dy: 1 } },
        { label: 'SE', facing: { dx: 1, dy: 1 } },
        { label: 'NW', facing: { dx: -1, dy: -1 } },
        { label: 'NE', facing: { dx: 1, dy: -1 } },
    ];

    const ANIMATION_LABELS: Record<AnimationState, string> = {
        idle: 'Idle',
        walking: 'Walking',
        attacking: 'Attacking',
        hit: 'Hit',
        dying: 'Dying',
    };

    let canvas: HTMLCanvasElement | null = $state(null);
    let arenaWidth = $state(CANVAS.width);
    let arenaHeight = $state(CANVAS.height);
    let enemySprites = $state<Partial<Record<EnemySpriteType, EnemySpriteLibrary>> | null>(null);
    let projectileSprites = $state<ProjectileSpriteSet | null>(null);

    let selectedType = $state<EnemyType>(savedSettings.selectedType);
    let selectedAnimation = $state<AnimationState>(savedSettings.selectedAnimation);
    let previewFacing = $state<FacingDirection>(facingFromKey(savedSettings.facing));
    let showMovement = $state(savedSettings.showMovement);
    let previewEnemy = $state<Enemy | null>(null);

    let previewFrameIndex = $state(savedSettings.previewFrameIndex);
    let previewFrameElapsed = $state(0);
    let speedProbeAngle = $state(0);
    let autoPlayFrames = $state(savedSettings.autoPlayFrames);
    let manualFrameIndex = $state(savedSettings.manualFrameIndex);
    let overrideFps = $state(savedSettings.overrideFps);
    let previewFps = $state(savedSettings.previewFps);

    let frameId = $state(0);
    let lastTime = $state(0);

    const previewCenter = $derived({
        x: arenaWidth / 2,
        y: arenaHeight / 2,
    });
    const speedOrbitRadius = 48;

    const stats = $derived(getEnemyStats(selectedType));
    const spriteConfig = $derived(getEnemySpriteConfig(selectedType));
    const spriteLibrary = $derived(enemySprites?.[selectedType as EnemySpriteType] ?? null);
    const hasArt = $derived(enemyHasSpriteArt(selectedType));
    const shoots = $derived(enemyShoots(selectedType));
    const projectileSpeed = $derived(enemyProjectileSpeed(selectedType));

    const facingKey = $derived(facingToSpriteKey(previewFacing));
    const orbitActive = $derived(showMovement && selectedAnimation === 'walking');
    const drawFacing = $derived.by((): FacingDirection => {
        if (orbitActive) {
            return snapEightDirection(-Math.sin(speedProbeAngle), Math.cos(speedProbeAngle));
        }
        return previewFacing;
    });
    const animationFacingKey = $derived(facingToSpriteKey(drawFacing));
    const resolvedClip = $derived(
        spriteConfig ? resolveAnimationConfig(spriteConfig)[selectedAnimation] : null,
    );
    const frameCount = $derived(
        resolvedClip ? getClipFrameCount(resolvedClip, animationFacingKey) : 1,
    );
    const configFps = $derived(
        spriteConfig ? getPreviewClipFps(spriteConfig, selectedAnimation) : DEFAULT_ANIMATION_FPS.idle,
    );
    const activeFps = $derived(overrideFps ? previewFps : configFps);
    const displayFrameIndex = $derived(autoPlayFrames ? previewFrameIndex : manualFrameIndex);

    $effect(() => {
        const max = Math.max(0, frameCount - 1);
        if (manualFrameIndex > max) manualFrameIndex = max;
        if (previewFrameIndex > max) previewFrameIndex = max;
    });

    const sampleProjectile = $derived.by((): Projectile | null => {
        if (!previewEnemy || !shoots) return null;
        const offset = 72;
        return {
            x: previewEnemy.x + previewFacing.dx * offset,
            y: previewEnemy.y + previewFacing.dy * offset,
            direction: { dx: previewFacing.dx, dy: previewFacing.dy },
            speed: projectileSpeed,
            damage: stats.damage,
            type: 'enemy',
        };
    });

    function resetFramePlayback() {
        previewFrameIndex = 0;
        previewFrameElapsed = 0;
        manualFrameIndex = 0;
        if (spriteConfig) {
            previewFps = getPreviewClipFps(spriteConfig, selectedAnimation);
        }
    }

    function repositionPreview(type: EnemyType = selectedType) {
        previewEnemy = createEnemy(type, previewCenter.x, previewCenter.y);
    }

    function resetPreview(type: EnemyType = selectedType) {
        repositionPreview(type);
        speedProbeAngle = 0;
        resetFramePlayback();
    }

    function selectEnemy(type: EnemyType) {
        selectedType = type;
        resetPreview(type);
    }

    function selectAnimation(state: AnimationState) {
        selectedAnimation = state;
        resetFramePlayback();
    }

    function selectFacing(facing: FacingDirection) {
        previewFacing = facing;
        manualFrameIndex = Math.min(manualFrameIndex, Math.max(0, frameCount - 1));
    }

    function setAutoPlay(enabled: boolean) {
        if (!enabled) {
            manualFrameIndex = previewFrameIndex;
        }
        autoPlayFrames = enabled;
    }

    function stepFrame(delta: number) {
        autoPlayFrames = false;
        manualFrameIndex = (manualFrameIndex + delta + frameCount) % frameCount;
    }

    function clampManualFrame(index: number) {
        manualFrameIndex = Math.max(0, Math.min(frameCount - 1, index));
    }

    function loop(now: number) {
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;

        if (previewEnemy && spriteConfig && autoPlayFrames) {
            const advanced = advancePreviewFrame(
                previewFrameElapsed,
                previewFrameIndex,
                spriteConfig,
                selectedAnimation,
                dt,
                { fps: activeFps, facing: animationFacingKey },
            );
            previewFrameElapsed = advanced.elapsed;
            previewFrameIndex = advanced.frameIndex;
        }

        if (previewEnemy && orbitActive) {
            speedProbeAngle += (stats.speed / speedOrbitRadius) * dt;
            previewEnemy.x = previewCenter.x + Math.cos(speedProbeAngle) * speedOrbitRadius;
            previewEnemy.y = previewCenter.y + Math.sin(speedProbeAngle) * speedOrbitRadius;
        } else if (previewEnemy) {
            previewEnemy.x = previewCenter.x;
            previewEnemy.y = previewCenter.y;
        }

        draw();
        frameId = requestAnimationFrame(loop);
    }

    function drawGrid(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, arenaWidth, arenaHeight);

        ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        ctx.lineWidth = 1;
        for (let gx = 0; gx < arenaWidth; gx += 50) {
            ctx.beginPath();
            ctx.moveTo(gx, 0);
            ctx.lineTo(gx, arenaHeight);
            ctx.stroke();
        }
        for (let gy = 0; gy < arenaHeight; gy += 50) {
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(arenaWidth, gy);
            ctx.stroke();
        }
    }

    function drawSpeedGuide(ctx: CanvasRenderingContext2D) {
        if (!previewEnemy || !orbitActive) return;

        const { x: centerX, y: centerY } = previewCenter;

        ctx.strokeStyle = 'rgba(96, 165, 250, 0.35)';
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, speedOrbitRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(30, 41, 59, 0.75)';
        ctx.font = '12px monospace';
        ctx.fillText(`${stats.speed} px/s`, previewEnemy.x + 14, previewEnemy.y - previewEnemy.size);
    }

    function draw() {
        const ctx = canvas?.getContext('2d');
        if (!ctx || !previewEnemy) return;

        drawGrid(ctx);

        if (spriteLibrary?.ready) {
            drawAnimatedSpriteAtState(
                ctx,
                previewEnemy,
                drawFacing,
                spriteLibrary,
                selectedAnimation,
                displayFrameIndex,
            );
        } else {
            drawEntityFallback(ctx, previewEnemy);
        }

        drawShadowOutline(ctx, previewEnemy);
        drawSpriteAnchorMarker(ctx, previewEnemy);
        drawHitboxOutline(ctx, withLiveHitbox(previewEnemy, stats.hitbox));

        drawSpeedGuide(ctx);

        if (sampleProjectile) {
            drawProjectile(ctx, sampleProjectile, projectileSprites);
        }

        ctx.fillStyle = 'rgba(100, 116, 139, 0.8)';
        ctx.font = '11px monospace';
        ctx.fillText(
            `facing: ${facingToSpriteKey(drawFacing).toUpperCase()}  frame: ${displayFrameIndex + 1}/${frameCount}  fps: ${activeFps.toFixed(1)}${overrideFps ? ' (override)' : ''}`,
            12,
            arenaHeight - 12,
        );
    }

    $effect(() => {
        if (arenaWidth <= 0 || arenaHeight <= 0) return;
        if (!previewEnemy) {
            repositionPreview(selectedType);
        }
    });

    $effect(() => {
        if (typeof localStorage === 'undefined') return;

        saveEnemyInspectorSettings({
            selectedType,
            selectedAnimation,
            facing: facingKey,
            showMovement,
            autoPlayFrames,
            manualFrameIndex,
            previewFrameIndex,
            overrideFps,
            previewFps,
        });
    });

    $effect(() => {
        lastTime = performance.now();
        frameId = requestAnimationFrame(loop);

        loadAllEnemySprites().then((loaded) => {
            enemySprites = loaded;
        });
        loadProjectileSprites([]).then((loaded) => {
            projectileSprites = loaded;
        });

        return () => {
            if (frameId) cancelAnimationFrame(frameId);
        };
    });
</script>

<DebugPlayground leftTitle="Enemy Inspector">
    {#snippet children()}
        <div class="relative h-full w-full">
            <GameCanvasFrame fill bind:width={arenaWidth} bind:height={arenaHeight} bind:canvas />
        </div>
    {/snippet}

    {#snippet left()}
        <p class="text-sm ro-muted">
            Gray ellipse = shadow (entity x/y is shadow center). Cyan cross = sprite/hitbox anchor.
            Amber rectangle = hitbox.
        </p>
        <RoWindow title="Enemy" bodyClass="p-3">
            <div class="flex flex-wrap gap-2">
                {#each ENEMY_CATALOG as entry}
                    <RoButton
                        class={selectedType === entry.type ? 'ring-2 ring-[#fbbf24]' : ''}
                        onclick={() => selectEnemy(entry.type)}
                    >
                        {entry.label}
                    </RoButton>
                {/each}
            </div>
        </RoWindow>

        <RoWindow title="Animation" bodyClass="p-3">
            <div class="flex flex-wrap gap-2">
                {#each ANIMATION_STATES as state}
                    <RoButton
                        class={selectedAnimation === state ? 'ring-2 ring-[#fbbf24]' : ''}
                        onclick={() => selectAnimation(state)}
                    >
                        {ANIMATION_LABELS[state]}
                    </RoButton>
                {/each}
            </div>
        </RoWindow>

        <RoWindow title="Facing" bodyClass="p-3">
            <div class="flex flex-wrap gap-2">
                {#each FACING_OPTIONS as option}
                    <RoButton
                        class={facingToSpriteKey(previewFacing) === facingToSpriteKey(option.facing)
                            ? 'ring-2 ring-[#fbbf24]'
                            : ''}
                        onclick={() => selectFacing(option.facing)}
                    >
                        {option.label}
                    </RoButton>
                {/each}
            </div>
        </RoWindow>

        <RoWindow title="Frame Debug" bodyClass="p-3 space-y-3">
            <label class="flex items-center gap-2 text-sm ro-muted">
                <input
                    type="checkbox"
                    checked={autoPlayFrames}
                    onchange={(e) => setAutoPlay(e.currentTarget.checked)}
                />
                Auto-play frames
            </label>

            <div class="space-y-2">
                <div class="flex items-center justify-between text-sm">
                    <span class="ro-muted">Frame</span>
                    <span class="font-mono text-[#1e293b]">{displayFrameIndex + 1} / {frameCount}</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max={Math.max(0, frameCount - 1)}
                    value={displayFrameIndex}
                    disabled={autoPlayFrames}
                    class="w-full disabled:opacity-50"
                    oninput={(e) => {
                        autoPlayFrames = false;
                        clampManualFrame(Number(e.currentTarget.value));
                    }}
                />
                <div class="flex flex-wrap gap-2">
                    <RoButton disabled={autoPlayFrames} onclick={() => stepFrame(-1)}>Prev</RoButton>
                    <RoButton disabled={autoPlayFrames} onclick={() => stepFrame(1)}>Next</RoButton>
                    <RoButton onclick={resetFramePlayback}>Reset</RoButton>
                </div>
            </div>

            <div class="space-y-2">
                <div class="flex items-center justify-between text-sm">
                    <span class="ro-muted">FPS</span>
                    <span class="font-mono text-[#1e293b]">
                        {activeFps.toFixed(1)}{overrideFps ? '' : ` (config: ${configFps})`}
                    </span>
                </div>
                <label class="flex items-center gap-2 text-sm ro-muted">
                    <input type="checkbox" bind:checked={overrideFps} />
                    Override frame rate
                </label>
                <input
                    type="range"
                    min="1"
                    max="24"
                    step="0.5"
                    bind:value={previewFps}
                    disabled={!overrideFps}
                    class="w-full disabled:opacity-50"
                />
                <input
                    type="number"
                    min="0.5"
                    max="60"
                    step="0.5"
                    bind:value={previewFps}
                    disabled={!overrideFps}
                    class="w-full rounded border border-[#a8c8f0]/60 bg-white/80 px-2 py-1 text-sm disabled:opacity-50"
                />
            </div>
        </RoWindow>

        <RoWindow title="Movement" bodyClass="p-3 space-y-2">
            <p class="text-sm">
                Speed: <strong class="text-[#1e293b]">{stats.speed} px/s</strong>
            </p>
            <label class="flex items-center gap-2 text-sm ro-muted">
                <input type="checkbox" bind:checked={showMovement} />
                Speed orbit when Walking is selected
            </label>
            <p class="text-xs ro-muted">
                Enemy orbits the dashed path at configured speed; facing follows movement.
            </p>
        </RoWindow>

        <RoWindow title="Stats" bodyClass="p-3">
            <dl class="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                <dt class="ro-muted">HP</dt><dd>{stats.hp}</dd>
                <dt class="ro-muted">Damage</dt><dd>{stats.damage}</dd>
                <dt class="ro-muted">Anchor size</dt><dd>{stats.size}px</dd>
                <dt class="ro-muted">Shadow</dt>
                <dd>{stats.shadow.size.x} x {stats.shadow.size.y}px</dd>
                <dt class="ro-muted">Sprite start</dt>
                <dd>{stats.shadow.anchor.x}%, {stats.shadow.anchor.y}% on shadow</dd>
                {#if spriteConfig?.layout.position}
                    <dt class="ro-muted">Layout offset</dt>
                    <dd>{spriteConfig.layout.position.x}px, {spriteConfig.layout.position.y}px</dd>
                {/if}
                <dt class="ro-muted">Hitbox</dt>
                <dd>{stats.hitbox.x} x {stats.hitbox.y}px</dd>
                {#if stats.hitbox.offset}
                    <dt class="ro-muted">Hitbox offset</dt>
                    <dd>{stats.hitbox.offset.x}px, {stats.hitbox.offset.y}px</dd>
                {/if}
                <dt class="ro-muted">Score</dt><dd>{stats.scoreValue}</dd>
                <dt class="ro-muted">Range</dt>
                <dd>{stats.range > 0 ? `${stats.range}px` : 'Melee'}</dd>
                <dt class="ro-muted">Sprite</dt>
                <dd>{hasArt ? 'Loaded' : 'Square fallback'}</dd>
            </dl>
        </RoWindow>

        {#if shoots}
            <RoWindow title="Projectile" bodyClass="p-3 space-y-2">
                <dl class="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                    <dt class="ro-muted">Speed</dt><dd>{projectileSpeed} px/s</dd>
                    <dt class="ro-muted">Damage</dt><dd>{stats.damage}</dd>
                    <dt class="ro-muted">Cooldown</dt><dd>{stats.shootCooldown}ms</dd>
                    <dt class="ro-muted">Sprite</dt><dd>Default circle</dd>
                </dl>
                <p class="text-xs ro-muted">
                    Preview bolt shown beside the enemy when this panel applies. Assign a sprite on
                    the projectile to replace the orange dot.
                </p>
            </RoWindow>
        {/if}
    {/snippet}
</DebugPlayground>
