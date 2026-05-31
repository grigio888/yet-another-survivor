<script lang="ts">
    import { Grunt, Shooter, Chief, type Enemy } from '$lib/game/entities/enemies';
    import { ENEMIES, CANVAS } from '$lib/game/config';
    import { separateEntities } from '$lib/game/systems/collision';
    import type { Projectile } from '$lib/game/systems/collision';
    import { spawnEnemy, type EnemyType } from '$lib/game/systems/spawning';
    import GameCanvasFrame from '$lib/components/GameCanvasFrame.svelte';

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

    const enemyClasses = [
        { label: 'Grunt', cls: Grunt },
        { label: 'Shooter', cls: Shooter },
        { label: 'Chief', cls: Chief },
    ];

    const W = CANVAS.width;
    const H = CANVAS.height;
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
            enemies.push(spawnEnemy(type as EnemyType));
        }
    }

    function resetAll() {
        enemies = [];
        enemyProjectiles = [];
        target = { x: W / 2, y: H / 2 };
        timeAlive = 0;
    }

    function countByType(type: string): number {
        return enemies.filter((e) => e.type === type).length;
    }

    // Click an enemy to damage it, so HP bars and death can be inspected
    function onCanvasClick(e: MouseEvent) {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (W / rect.width);
        const y = (e.clientY - rect.top) * (H / rect.height);

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
            p.x > W + PROJECTILE_MARGIN ||
            p.y < -PROJECTILE_MARGIN ||
            p.y > H + PROJECTILE_MARGIN
        );
    }

    function loop(now: number) {
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        timeAlive += dt;

        // Move the target marker with WASD (Shift = faster)
        const speed = movement.sprint ? TARGET_SPEED * 2 : TARGET_SPEED;
        target.x = Math.max(0, Math.min(W, target.x + movement.dx * speed * dt));
        target.y = Math.max(0, Math.min(H, target.y + movement.dy * speed * dt));

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
        frameId = requestAnimationFrame(loop);
    }

    function draw() {
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

        // Debug overlay
        ctx.fillStyle = '#000';
        ctx.font = '12px monospace';
        ctx.fillText(`time: ${timeAlive.toFixed(1)}s`, 5, 15);
        ctx.fillText(`enemies: ${enemies.length}`, 5, 30);
        ctx.fillText(`grunts: ${countByType('grunt')}`, 5, 45);
        ctx.fillText(`shooters: ${countByType('shooter')}`, 5, 60);
        ctx.fillText(`chiefs: ${countByType('chief')}`, 5, 75);
        ctx.fillText(`projectiles: ${enemyProjectiles.length}`, 5, 90);
    }

    $effect(() => {
        if (canvas) {
            canvas.width = W;
            canvas.height = H;
        }

        lastTime = performance.now();
        frameId = requestAnimationFrame(loop);
        window.addEventListener('keydown', onKeydown);
        window.addEventListener('keyup', onKeyup);

        return () => {
            if (frameId) cancelAnimationFrame(frameId);
            window.removeEventListener('keydown', onKeydown);
            window.removeEventListener('keyup', onKeyup);
        }
    });
</script>

<h1 class="text-6xl my-4 text-center">Enemies Debug</h1>

<div class="debug-stage rounded-md overflow-hidden border border-(--border-color)">
    <div class="flex flex-col justify-between gap-2 p-4 w-96 border-r border-(--border-color)"
        >
            <div class="flex flex-col gap-2">
                <h3 class="text-lg font-bold mb-2">Spawn Enemies</h3>
                {#each enemyClasses as ec}
                    <button
                        class="bg-(--background-color) border border-(--border-color) text-white
                        px-4 py-2 rounded-md hover:bg-(--theme-color-600) transition-colors duration-200
                        cursor-pointer"
                        onclick={() => addEnemy(ec.label.toLowerCase())}
                    >
                        {ec.label}
                    </button>
                {/each}
                <button class="bg-(--theme-color-600) text-white px-4 py-2 rounded-md
                    hover:bg-(--theme-color-700) transition-colors duration-200"
                    onclick={resetAll}
                >
                    Reset All
                </button>
            </div>
            <hr class="h-px">
            <h3 class="text-lg font-bold mb-2">Enemy Stats</h3>
            <table class="w-full text-sm">
                <thead><tr><th>Type</th><th>HP</th><th>Speed</th><th>Dmg</th><th>Range</th><th>Color</th></tr></thead>
                <tbody>
                    <tr><td>Grunt</td><td>{ENEMIES.grunt.hp}</td><td>{ENEMIES.grunt.speed}</td><td>{ENEMIES.grunt.damage}</td><td>Melee</td><td style="color: {ENEMIES.grunt.color}">Grunt</td></tr>
                    <tr><td>Shooter</td><td>{ENEMIES.shooter.hp}</td><td>{ENEMIES.shooter.speed}</td><td>{ENEMIES.shooter.damage}</td><td>{ENEMIES.shooter.range}px</td><td style="color: {ENEMIES.shooter.color}">Shooter</td></tr>
                    <tr><td>Chief</td><td>{ENEMIES.chief.hp}</td><td>{ENEMIES.chief.speed}</td><td>{ENEMIES.chief.damage}</td><td>Melee</td><td style="color: {ENEMIES.chief.color}">Chief</td></tr>
                </tbody>
            </table>
            <hr class="h-px">
            <div class="flex flex-col gap-2">
                <h3 class="text-lg font-bold mb-2">Controls</h3>
                <p class="text-sm text-gray-500">WASD/Arrows: Move the target marker</p>
                <p class="text-sm text-gray-500">Shift: Move target faster</p>
                <p class="text-sm text-gray-500">Click an enemy to damage it ({CLICK_DAMAGE} dmg)</p>
            </div>
    </div>
    <GameCanvasFrame width={W} height={H} bind:canvas onGameClick={onCanvasClick} />
</div>
