<script lang="ts">
    import {
        CHARACTER_STATS,
        characterHasSpriteArt,
        createCharacter,
        getCharacterSpriteConfig,
        type Character,
        type CharacterId,
    } from '$lib/game/entities/characters';
    import { CANVAS } from '$lib/game/config';
    import {
        ANIMATION_STATES,
        DEFAULT_ANIMATION_FPS,
        getClipFrameCount,
        resolveAnimationConfig,
        type AnimationState,
    } from '$lib/game/animation';
    import {
        getSpriteFrameOverrides,
        mergeSpriteFrameLayout,
    } from '$lib/game/animation/spriteFrame';
    import {
        advancePreviewFrame,
        drawAnimatedSprite,
        drawAnimatedSpriteAtState,
        drawEntityFallback,
        getPreviewClipFps,
    } from '$lib/game/rendering/entitySprites';
    import {
        drawCharacterAttackRange,
        drawCharacterHitbox,
        facingToSpriteKey,
        loadCharacterSprites,
        snapEightDirection,
        type CharacterSpriteLibrary,
        type FacingDirection,
    } from '$lib/game/rendering/characterSprites';
    import {
        clampShadowCenter,
        drawShadowOutline,
        drawSpriteAnchorMarker,
    } from '$lib/game/rendering/shadow';
    import { withLiveHitbox } from '$lib/game/systems/hitbox';
    import GameCanvasFrame from '$lib/components/GameCanvasFrame.svelte';
    import DebugPlayground from '$lib/components/DebugPlayground.svelte';
    import CharacterItemLoadout from '$lib/components/CharacterItemLoadout.svelte';
    import DebugHud from '$lib/components/DebugHud.svelte';
    import { RoButton, RoWindow } from '$lib/components/ui';
    import {
        facingFromKey,
        loadCharacterInspectorSettings,
        saveCharacterInspectorSettings,
    } from '$lib/debug/characterInspectorStorage';

    const savedSettings =
        typeof localStorage !== 'undefined'
            ? loadCharacterInspectorSettings()
            : loadCharacterInspectorSettings({ getItem: () => null });

    const CHARACTER_OPTIONS: { label: string; type: CharacterId }[] = [
        { label: 'Mage', type: 'mage' },
        { label: 'Peasant', type: 'peasant' },
    ];

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
    let character: Character | null = $state(null);
    let sprites = $state<CharacterSpriteLibrary | null>(null);
    let frameId = $state(0);
    let lastTime = $state(0);
    let keys = $state(new Set<string>());
    let movement = $state({ dx: 0, dy: 0, sprint: false });
    let invincible = $state(false);
    let timeAlive = $state(0);
    let arenaWidth = $state(CANVAS.width);
    let arenaHeight = $state(CANVAS.height);
    let hudLines = $state<string[]>([]);

    let selectedType = $state<CharacterId>(savedSettings.selectedType);
    let selectedAnimation = $state<AnimationState>(savedSettings.selectedAnimation);
    let drawFacing = $state<FacingDirection>(facingFromKey(savedSettings.facing));
    let showMovement = $state(savedSettings.showMovement);
    let previewFrameIndex = $state(savedSettings.previewFrameIndex);
    let previewFrameElapsed = $state(0);
    let speedProbeAngle = $state(0);
    let autoPlayFrames = $state(savedSettings.autoPlayFrames);
    let manualFrameIndex = $state(savedSettings.manualFrameIndex);
    let overrideFps = $state(savedSettings.overrideFps);
    let previewFps = $state(savedSettings.previewFps);
    let animationPreviewLocked = $state(false);

    const previewCenter = $derived({
        x: arenaWidth / 2,
        y: arenaHeight / 2,
    });
    const speedOrbitRadius = 48;

    const stats = $derived(CHARACTER_STATS[selectedType]);
    const spriteConfig = $derived(getCharacterSpriteConfig(selectedType));
    const hasArt = $derived(characterHasSpriteArt(selectedType));

    const facingKey = $derived(facingToSpriteKey(drawFacing));
    const orbitActive = $derived(showMovement && selectedAnimation === 'walking');
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
    const useRuntimeAnimator = $derived(
        orbitActive ||
            movement.dx !== 0 ||
            movement.dy !== 0 ||
            !animationPreviewLocked,
    );

    $effect(() => {
        const max = Math.max(0, frameCount - 1);
        if (manualFrameIndex > max) manualFrameIndex = max;
        if (previewFrameIndex > max) previewFrameIndex = max;
    });

    function characterConfig(c: Character) {
        return CHARACTER_STATS[c.type as CharacterId];
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
        let dx = 0;
        let dy = 0;
        const sprint = keys.has('shift');

        if (keys.has('w') || keys.has('arrowup')) dy -= 1;
        if (keys.has('s') || keys.has('arrowdown')) dy += 1;
        if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
        if (keys.has('d') || keys.has('arrowright')) dx += 1;

        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
            dx /= len;
            dy /= len;
        }
        movement = { dx, dy, sprint };
    }

    function resetFramePlayback() {
        previewFrameIndex = 0;
        previewFrameElapsed = 0;
        manualFrameIndex = 0;
        if (spriteConfig) {
            previewFps = getPreviewClipFps(spriteConfig, selectedAnimation);
        }
    }

    function refreshDrawFacing() {
        if (!character) return;

        if (orbitActive) {
            const next = snapEightDirection(-Math.sin(speedProbeAngle), Math.cos(speedProbeAngle));
            character.facing = next;
            drawFacing = next;
            return;
        }

        drawFacing = character.facing;
    }

    function getActiveFrameLayout() {
        if (!spriteConfig) return null;

        const state = useRuntimeAnimator
            ? (character?.animator.getState() ?? 'idle')
            : selectedAnimation;
        const frameIndex = useRuntimeAnimator
            ? (character?.animator.getFrameIndex() ?? 0)
            : displayFrameIndex;
        const clip = resolveAnimationConfig(spriteConfig)[state];
        const facing = animationFacingKey;
        const frames = clip.frames[facing];
        const frame = frames[Math.min(frameIndex, frames.length - 1)];

        return mergeSpriteFrameLayout(spriteConfig.layout, frame);
    }

    function getActiveFrameOverrides() {
        if (!spriteConfig) return {};

        const state = useRuntimeAnimator
            ? (character?.animator.getState() ?? 'idle')
            : selectedAnimation;
        const frameIndex = useRuntimeAnimator
            ? (character?.animator.getFrameIndex() ?? 0)
            : displayFrameIndex;
        const clip = resolveAnimationConfig(spriteConfig)[state];
        const frame = clip.frames[animationFacingKey][Math.min(frameIndex, clip.frames[animationFacingKey].length - 1)];

        return getSpriteFrameOverrides(frame);
    }

    function resetCharacter(type: CharacterId = selectedType) {
        character = createCharacter(type, previewCenter.x, previewCenter.y);
        character.facing = drawFacing;
        animationPreviewLocked = false;
        speedProbeAngle = 0;
        timeAlive = 0;
        resetFramePlayback();
    }

    async function switchCharacter(type: CharacterId) {
        selectedType = type;
        sprites = await loadCharacterSprites(type);
        resetCharacter(type);
    }

    function selectAnimation(state: AnimationState) {
        selectedAnimation = state;
        animationPreviewLocked = true;
        resetFramePlayback();
    }

    function enableLivePreview() {
        animationPreviewLocked = false;
        character?.animator.reset();
        resetFramePlayback();
    }

    function selectFacing(facing: FacingDirection) {
        drawFacing = facing;
        if (character) character.facing = facing;
        manualFrameIndex = Math.min(manualFrameIndex, Math.max(0, frameCount - 1));
    }

    function setAutoPlay(enabled: boolean) {
        if (!enabled) {
            manualFrameIndex = previewFrameIndex;
        }
        autoPlayFrames = enabled;
        animationPreviewLocked = true;
    }

    function stepFrame(delta: number) {
        autoPlayFrames = false;
        animationPreviewLocked = true;
        manualFrameIndex = (manualFrameIndex + delta + frameCount) % frameCount;
    }

    function clampManualFrame(index: number) {
        animationPreviewLocked = true;
        manualFrameIndex = Math.max(0, Math.min(frameCount - 1, index));
    }

    function takeDamage() {
        character?.takeDamage(1);
    }

    function healFull() {
        if (character) {
            const config = characterConfig(character);
            character.hp = character.maxHp;
            character.lives = config.maxLives;
            character.animator.reset();
        }
    }

    function loop(now: number) {
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;

        if (character && spriteConfig && autoPlayFrames && !useRuntimeAnimator) {
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

        if (character) {
            if (orbitActive) {
                speedProbeAngle += (stats.speed / speedOrbitRadius) * dt;
                character.x = previewCenter.x + Math.cos(speedProbeAngle) * speedOrbitRadius;
                character.y = previewCenter.y + Math.sin(speedProbeAngle) * speedOrbitRadius;
                character.animator.update(dt, {
                    isMoving: true,
                    isDead: character.lives <= 0,
                });
            } else {
                character.update(dt, movement);
                clampShadowCenter(character, arenaWidth, arenaHeight);
            }

            timeAlive += dt;
            invincible = character.isInvincible();
            refreshDrawFacing();
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

        const config = characterConfig(character);
        const frameLayout = getActiveFrameLayout();
        const frameOverrides = getActiveFrameOverrides();
        hudLines = [
            `type: ${character.type}`,
            `pos: (${character.x.toFixed(1)}, ${character.y.toFixed(1)})`,
            `hp: ${character.hp} / ${character.maxHp}`,
            `lives: ${character.lives}`,
            `invincible: ${invincible}`,
            `active: ${character.inventory.getActiveCount()}/4`,
            `passive: ${character.inventory.getPassiveCount()}/4`,
            `speed: ${movement.sprint ? config.speed * 2 : config.speed}`,
            `time: ${timeAlive.toFixed(1)}s`,
            `facing: ${facingToSpriteKey(drawFacing).toUpperCase()}`,
            `mode: ${useRuntimeAnimator ? 'live' : `preview (${selectedAnimation})`}`,
            `anim: ${character.animator.getState()} frame ${character.animator.getFrameIndex() + 1}`,
            ...(frameLayout
                ? [`zoom: ${frameLayout.zoom}${frameOverrides.zoom !== undefined ? ' (frame)' : ' (layout)'}`]
                : []),
            ...(useRuntimeAnimator
                ? []
                : [`preview frame: ${displayFrameIndex + 1}/${frameCount}`]),
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
                const even = (tx / tile + ty / tile) % 2 === 0;
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

    function drawSpeedGuide(ctx: CanvasRenderingContext2D) {
        if (!character || !orbitActive) return;

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
        ctx.fillText(`${stats.speed} px/s`, character.x + 14, character.y - character.size);
    }

    function draw() {
        const ctx = canvas?.getContext('2d');
        if (!ctx || !character) return;

        drawGround(ctx);
        drawCharacterAttackRange(ctx, character);

        if (invincible) {
            ctx.globalAlpha = 0.5;
        }

        if (sprites?.ready) {
            if (useRuntimeAnimator) {
                drawAnimatedSprite(ctx, character, drawFacing, sprites);
            } else {
                drawAnimatedSpriteAtState(
                    ctx,
                    character,
                    drawFacing,
                    sprites,
                    selectedAnimation,
                    displayFrameIndex,
                );
            }
        } else {
            drawEntityFallback(ctx, character);
        }

        drawShadowOutline(ctx, character);
        drawSpriteAnchorMarker(ctx, character);
        drawCharacterHitbox(ctx, withLiveHitbox(character, stats.hitbox));
        drawSpeedGuide(ctx);

        ctx.globalAlpha = 1;

        if (invincible) {
            ctx.fillStyle = '#000';
            ctx.font = '14px monospace';
            ctx.fillText('INVULNERABLE', character.x + 20, character.y);
        }

        ctx.fillStyle = 'rgba(100, 116, 139, 0.8)';
        ctx.font = '11px monospace';
        ctx.fillText(
            `facing: ${facingToSpriteKey(drawFacing).toUpperCase()}  ${useRuntimeAnimator ? `anim: ${character.animator.getState()}` : `preview: ${selectedAnimation} ${displayFrameIndex + 1}/${frameCount}`}  fps: ${activeFps.toFixed(1)}${overrideFps ? ' (override)' : ''}`,
            12,
            arenaHeight - 12,
        );
    }

    $effect(() => {
        if (arenaWidth <= 0 || arenaHeight <= 0 || character) return;
        resetCharacter(selectedType);
        loadCharacterSprites(selectedType).then((loaded) => {
            sprites = loaded;
        });
    });

    $effect(() => {
        if (typeof localStorage === 'undefined') return;

        saveCharacterInspectorSettings({
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
        window.addEventListener('keydown', onKeydown);
        window.addEventListener('keyup', onKeyup);

        return () => {
            if (frameId) cancelAnimationFrame(frameId);
            window.removeEventListener('keydown', onKeydown);
            window.removeEventListener('keyup', onKeyup);
        };
    });
</script>

<DebugPlayground leftTitle="Character Inspector" rightTitle="Information">
    {#snippet children()}
        <div class="relative h-full w-full">
            <GameCanvasFrame fill bind:width={arenaWidth} bind:height={arenaHeight} bind:canvas />
        </div>
    {/snippet}

    {#snippet overlays()}
        <div class="relative h-full w-full flex justify-center items-end">
            {#if character}
                <RoWindow title="Skills" class="w-70 mb-3" bodyClass="p-2">
                    <CharacterItemLoadout inventory={character.inventory} bare showLabels={false} />
                </RoWindow>
            {/if}
        </div>
    {/snippet}

    {#snippet left()}
        <p class="text-sm ro-muted">
            Gray ellipse = shadow (entity x/y is shadow center). Cyan cross = sprite start.
            Amber rectangle = hitbox. Blue ring = attack range.
        </p>

        <RoWindow title="Character" bodyClass="p-3">
            <div class="flex flex-wrap gap-2">
                {#each CHARACTER_OPTIONS as option}
                    <RoButton
                        class={selectedType === option.type ? 'ring-2 ring-[#fbbf24]' : ''}
                        onclick={() => switchCharacter(option.type)}
                    >
                        {option.label}
                    </RoButton>
                {/each}
            </div>
        </RoWindow>

        <RoWindow title="Animation" bodyClass="p-3 space-y-2">
            <div class="flex flex-wrap gap-2">
                {#each ANIMATION_STATES as state}
                    <RoButton
                        class={!useRuntimeAnimator && selectedAnimation === state
                            ? 'ring-2 ring-[#fbbf24]'
                            : ''}
                        onclick={() => selectAnimation(state)}
                    >
                        {ANIMATION_LABELS[state]}
                    </RoButton>
                {/each}
            </div>
            <RoButton
                class={useRuntimeAnimator ? 'ring-2 ring-[#fbbf24]' : ''}
                onclick={enableLivePreview}
            >
                Live (movement drives anim)
            </RoButton>
            <p class="text-xs ro-muted">
                Live mode switches idle/walking from movement. Pick a state above to scrub frames
                while standing still.
            </p>
        </RoWindow>

        <RoWindow title="Facing" bodyClass="p-3">
            <div class="flex flex-wrap gap-2">
                {#each FACING_OPTIONS as option}
                    <RoButton
                        class={facingToSpriteKey(drawFacing) === facingToSpriteKey(option.facing)
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
            {#if useRuntimeAnimator}
                <p class="text-sm ro-muted">
                    Frame scrubbing applies in preview mode. Click an animation state or disable Live
                    to scrub.
                </p>
            {:else}
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
            {/if}
        </RoWindow>

        <RoWindow title="Movement" bodyClass="p-3 space-y-2">
            <p class="text-sm ro-muted">WASD/Arrows: Move · Shift: Sprint</p>
            <p class="text-sm">
                Speed: <strong class="text-[#1e293b]">{stats.speed} px/s</strong>
            </p>
            <label class="flex items-center gap-2 text-sm ro-muted">
                <input type="checkbox" bind:checked={showMovement} />
                Speed orbit when Walking is selected
            </label>
        </RoWindow>

        <RoWindow title="Stats" bodyClass="p-3">
            <dl class="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                <dt class="ro-muted">HP</dt><dd>{stats.maxHp}</dd>
                <dt class="ro-muted">Lives</dt><dd>{stats.maxLives}</dd>
                <dt class="ro-muted">Anchor size</dt><dd>{stats.size}px</dd>
                <dt class="ro-muted">Shadow</dt>
                <dd>{stats.shadow.size.x} x {stats.shadow.size.y}px</dd>
                <dt class="ro-muted">Sprite start</dt>
                <dd>{stats.shadow.anchor.x}%, {stats.shadow.anchor.y}% on shadow</dd>
                <dt class="ro-muted">Hitbox</dt>
                <dd>{stats.hitbox.x} x {stats.hitbox.y}px</dd>
                {#if stats.hitbox.offset}
                    <dt class="ro-muted">Hitbox offset</dt>
                    <dd>{stats.hitbox.offset.x}px, {stats.hitbox.offset.y}px</dd>
                {/if}
                {#if spriteConfig?.layout.position}
                    <dt class="ro-muted">Layout offset</dt>
                    <dd>{spriteConfig.layout.position.x}px, {spriteConfig.layout.position.y}px</dd>
                {/if}
                <dt class="ro-muted">Layout zoom</dt>
                <dd>{spriteConfig.layout.zoom}</dd>
                <dt class="ro-muted">Layout height</dt>
                <dd>{spriteConfig.layout.heightScale}x</dd>
                {#if getActiveFrameOverrides().zoom !== undefined}
                    <dt class="ro-muted">Frame zoom</dt>
                    <dd>{getActiveFrameOverrides().zoom}</dd>
                {/if}
                <dt class="ro-muted">Effective zoom</dt>
                <dd>{getActiveFrameLayout()?.zoom ?? spriteConfig.layout.zoom}</dd>
                <dt class="ro-muted">Speed</dt><dd>{stats.speed} px/s</dd>
                <dt class="ro-muted">Sprite</dt>
                <dd>{hasArt ? 'Loaded' : 'Square fallback'}</dd>
            </dl>
        </RoWindow>

        <div class="flex flex-col gap-2">
            <RoButton onclick={takeDamage}>Take Damage (-1 life)</RoButton>
            <RoButton onclick={healFull}>Full Heal</RoButton>
            <RoButton onclick={() => resetCharacter()}>Reset</RoButton>
        </div>
    {/snippet}

    {#snippet right()}
        <DebugHud lines={hudLines} />
    {/snippet}
</DebugPlayground>
