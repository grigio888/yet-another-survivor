<script lang="ts">
    import { Grunt, Shooter, Chief, type Enemy } from '$lib/game/entities/enemies';
    import { ENEMIES, CANVAS } from '$lib/game/config';
    import { separateEntities } from '$lib/game/systems/collision';
    import type { Projectile } from '$lib/game/systems/collision';
    import { spawnEnemy, type EnemyType } from '$lib/game/systems/spawning';
    import GameCanvasFrame from '$lib/components/GameCanvasFrame.svelte';
    import DebugPlayground from '$lib/components/DebugPlayground.svelte';
    import DebugHud from '$lib/components/DebugHud.svelte';
    import { RoButton, RoWindow } from '$lib/components/ui';

    let canvas: HTMLCanvasElement | null = $state(null);
    let enemies = $state<Enemy[]>([]);
    let enemyProjectiles = $state<Projectile[]>([]);
    let frameId = $state(0);
    let lastTime = $state(0);
    let keys = $state(new Set<string>());
    let movement = $state({ dx: 0, dy: 0, sprint: false });
    let timeAlive = $state(0);
    // A movable point the enemies chase / aim at (stands in for the player)
    let target = $state({ x: CANVAS.width / 2, y: CANVAS.height / 2 });
    let arenaWidth = $state(CANVAS.width);
    let arenaHeight = $state(CANVAS.height);
    let hudLines = $state<string[]>([]);

    const enemyClasses = [
        { label: 'Grunt', cls: Grunt },
        { label: 'Shooter', cls: Shooter },
        { label: 'Chief', cls: Chief },
    ];

    // Speed the target marker moves under WASD, in pixels per second
    const TARGET_SPEED = 200;
    // Damage applied when clicking an enemy
    const CLICK_DAMAGE = 25;
    // How far a projectile may travel past the canvas before being culled
    const PROJECTILE_MARGIN = 50;

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
        if (keys.has('w') || keys.has('arrowup')) dy -= 1;
        if (keys.has('s') || keys.has('arrowdown')) dy += 1;
        if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
        if (keys.has('d') || keys.has('arrowright')) dx += 1;
        const sprint = keys.has('shift');
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
            dx /= len;
            dy /= len;
        }
        movement = { dx, dy, sprint };
    }

    function addEnemy(type: string) {
        if (type === 'grunt' || type === 'shooter' || type === 'chief') {
            enemies.push(spawnEnemy(type as EnemyType, arenaWidth, arenaHeight));
        }
    }

    function resetAll() {
        enemies = [];
        enemyProjectiles = [];
        target = { x: arenaWidth / 2, y: arenaHeight / 2 };
        timeAlive = 0;
    }

    function countByType(type: string): number {
        return enemies.filter((e) => e.type === type).length;
    }

    // Click an enemy to damage it, so HP bars and death can be inspected
    function onCanvasClick(e: MouseEvent) {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        for (let i = enemies.length - 1; i >= 0; i--) {
            const en = enemies[i];
            if (Math.abs(en.x - x) <= en.size / 2 && Math.abs(en.y - y) <= en.size / 2) {
                en.takeDamage(CLICK_DAMAGE);
                if (!en.isAlive()) enemies.splice(i, 1);
                enemies = enemies;
                break;
            }
        }
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

        // Move the target marker with WASD (Shift = faster)
        const speed = movement.sprint ? TARGET_SPEED * 2 : TARGET_SPEED;
        target.x = Math.max(0, Math.min(arenaWidth, target.x + movement.dx * speed * dt));
        target.y = Math.max(0, Math.min(arenaHeight, target.y + movement.dy * speed * dt));

        // Update enemy AI; shooters return a projectile aimed at the target
        for (const e of enemies) {
            const result = e.update(dt, target.x, target.y);
            if (result) enemyProjectiles.push(result);
        }

        // Keep enemies from stacking on top of each other
        separateEntities(enemies, 2);

        // Advance projectiles and cull those that leave the arena
        for (const p of enemyProjectiles) {
            p.x += p.direction.dx * p.speed * dt;
            p.y += p.direction.dy * p.speed * dt;
        }
        enemyProjectiles = enemyProjectiles.filter((p) => !offscreen(p));

        draw();
        syncHud();
        frameId = requestAnimationFrame(loop);
    }

    function syncHud() {
        hudLines = [
            `time: ${timeAlive.toFixed(1)}s`,
            `enemies: ${enemies.length}`,
            `grunts: ${countByType('grunt')}`,
            `shooters: ${countByType('shooter')}`,
            `chiefs: ${countByType('chief')}`,
            `projectiles: ${enemyProjectiles.length}`,
        ];
    }

    function draw() {
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, arenaWidth, arenaHeight);

        ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        ctx.lineWidth = 1;
        for (let gx = 0; gx < arenaWidth; gx += 50) {
            ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, arenaHeight); ctx.stroke();
        }
        for (let gy = 0; gy < arenaHeight; gy += 50) {
            ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(arenaWidth, gy); ctx.stroke();
        }

        // Draw the target marker enemies are reacting to
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(target.x, target.y, 8, 0, Math.PI * 2);
        ctx.moveTo(target.x - 12, target.y);
        ctx.lineTo(target.x + 12, target.y);
        ctx.moveTo(target.x, target.y - 12);
        ctx.lineTo(target.x, target.y + 12);
        ctx.stroke();

        // Draw enemies
        for (const e of enemies) {
            ctx.fillStyle = e.color;
            ctx.fillRect(e.x - e.size / 2, e.y - e.size / 2, e.size, e.size);

            // HP bar
            const hpRatio = e.hp / e.maxHp;
            const barW = e.size;
            ctx.fillStyle = '#ccc';
            ctx.fillRect(e.x - barW / 2, e.y - e.size / 2 - 8, barW, 4);
            ctx.fillStyle = hpRatio > 0.5 ? '#4ade8f' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';
            ctx.fillRect(e.x - barW / 2, e.y - e.size / 2 - 8, barW * hpRatio, 4);
        }

        // Draw enemy projectiles
        ctx.fillStyle = '#f97316';
        for (const p of enemyProjectiles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

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

<DebugPlayground leftTitle="Spawn Lab">
    {#snippet children()}
        <div class="relative h-full w-full">
            <GameCanvasFrame fill bind:width={arenaWidth} bind:height={arenaHeight} bind:canvas onGameClick={onCanvasClick} />
        </div>
    {/snippet}

    {#snippet overlays()}
        <RoWindow title="Status" class="absolute top-3 right-3 w-52" bodyClass="p-2">
            <DebugHud lines={hudLines} />
        </RoWindow>
    {/snippet}

    {#snippet left()}
        <div class="flex flex-col gap-2">
            {#each enemyClasses as ec}
                <RoButton onclick={() => addEnemy(ec.label.toLowerCase())}>{ec.label}</RoButton>
            {/each}
            <RoButton onclick={resetAll}>Reset All</RoButton>
        </div>
        <hr class="h-px border-[#a8c8f0]/60" />
        <table class="w-full text-sm ro-muted">
            <thead><tr><th>Type</th><th>HP</th><th>Speed</th><th>Dmg</th><th>Range</th><th>Color</th></tr></thead>
            <tbody>
                <tr><td>Grunt</td><td>{ENEMIES.grunt.hp}</td><td>{ENEMIES.grunt.speed}</td><td>{ENEMIES.grunt.damage}</td><td>Melee</td><td style="color: {ENEMIES.grunt.color}">Grunt</td></tr>
                <tr><td>Shooter</td><td>{ENEMIES.shooter.hp}</td><td>{ENEMIES.shooter.speed}</td><td>{ENEMIES.shooter.damage}</td><td>{ENEMIES.shooter.range}px</td><td style="color: {ENEMIES.shooter.color}">Shooter</td></tr>
                <tr><td>Chief</td><td>{ENEMIES.chief.hp}</td><td>{ENEMIES.chief.speed}</td><td>{ENEMIES.chief.damage}</td><td>Melee</td><td style="color: {ENEMIES.chief.color}">Chief</td></tr>
            </tbody>
        </table>
        <hr class="h-px border-[#a8c8f0]/60" />
        <div class="flex flex-col gap-2">
            <p class="text-sm ro-muted">WASD/Arrows: Move the target marker</p>
            <p class="text-sm ro-muted">Shift: Move target faster</p>
            <p class="text-sm ro-muted">Click an enemy to damage it ({CLICK_DAMAGE} dmg)</p>
        </div>
    {/snippet}
</DebugPlayground>
