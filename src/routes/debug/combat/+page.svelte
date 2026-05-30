<script lang="ts">
    import { Mage, type Character } from '$lib/game/entities/characters';
    import { Grunt, Shooter, Chief, type Enemy } from '$lib/game/entities/enemies';
    import { ENEMIES, CANVAS, CHARACTERS } from '$lib/game/config';
    import { projectileHitsEntity, separateEntities } from '$lib/game/systems/collision';
    import type { Projectile } from '$lib/game/systems/collision';
    import { processCombat } from '$lib/game/systems/combat';
    import type { CombatStats } from '$lib/game/systems/combat';

    let canvas: HTMLCanvasElement | null = $state(null);
    let character: Character | null = $state(null);
    let enemies = $state<Enemy[]>([]);
    let playerProjectiles = $state<Projectile[]>([]);
    let enemyProjectiles = $state<Projectile[]>([]);
    let frameId = $state(0);
    let lastTime = $state(0);
    let keys = $state(new Set<string>());
    let movement = $state({ dx: 0, dy: 0, sprint: false });
    let invincible = $state(false);
    let timeAlive = $state(0);
    let stats = $state<CombatStats>(createStats());

    const enemyClasses = [
        { label: 'Grunt', cls: Grunt },
        { label: 'Shooter', cls: Shooter },
        { label: 'Chief', cls: Chief },
    ];

    const W = CANVAS.width;
    const H = CANVAS.height;
    // How far a projectile may travel past the canvas before being culled
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
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
            dx /= len;
            dy /= len;
        }
        movement = { dx, dy, sprint };
    }

    function addEnemy(type: string) {
        if (type === 'grunt') enemies.push(new Grunt(Math.random() * W, Math.random() * H));
        else if (type === 'shooter') enemies.push(new Shooter(Math.random() * W, Math.random() * H));
        else if (type === 'chief') enemies.push(new Chief(Math.random() * W, Math.random() * H));
    }

    function resetAll() {
        enemies = [];
        playerProjectiles = [];
        enemyProjectiles = [];
        if (character) {
            character.hp = character.maxHp;
            character.lives = CHARACTERS.mage.maxLives;
            character.invincibleUntil = 0;
            character.lastShot = 0;
        }
        stats = createStats();
        timeAlive = 0;
    }

    // Nearest living enemy to the player, used for auto-fire targeting
    function nearestEnemy(): Enemy | null {
        if (!character) return null;
        let best: Enemy | null = null;
        let bestDist = Infinity;
        for (const e of enemies) {
            const dx = e.x - character.x;
            const dy = e.y - character.y;
            const d = dx * dx + dy * dy;
            if (d < bestDist) {
                bestDist = d;
                best = e;
            }
        }
        return best;
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

        // Player movement + auto-fire toward the nearest enemy
        const canShoot = character.update(dt, movement);
        character.x = Math.max(character.size / 2, Math.min(W - character.size / 2, character.x));
        character.y = Math.max(character.size / 2, Math.min(H - character.size / 2, character.y));
        invincible = character.isInvincible();

        if (canShoot) {
            const target = nearestEnemy();
            if (target) {
                const proj = character.shoot(target);
                if (proj) playerProjectiles.push(proj);
            }
        }

        // Update enemy AI; shooters return a projectile aimed at the player
        for (const e of enemies) {
            const result = e.update(dt, character.x, character.y);
            if (result) enemyProjectiles.push(result);
        }

        // Keep enemies from stacking on top of each other
        separateEntities(enemies, 2);

        // Advance every projectile along its direction
        for (const p of playerProjectiles) {
            p.x += p.direction.dx * p.speed * dt;
            p.y += p.direction.dy * p.speed * dt;
        }
        for (const p of enemyProjectiles) {
            p.x += p.direction.dx * p.speed * dt;
            p.y += p.direction.dy * p.speed * dt;
        }

        // Resolve all damage, kills, scoring, and player hits in one place
        const result = processCombat(playerProjectiles, enemyProjectiles, enemies, character, stats, dt);

        // Remove spent player projectiles and any that flew off-screen
        playerProjectiles = playerProjectiles.filter(
            (p, i) => !result.combat.projectilesToRemove.has(i) && !offscreen(p)
        );
        // Enemy projectiles are consumed on contact (damage already applied)
        enemyProjectiles = enemyProjectiles.filter(
            (p) => !offscreen(p) && !projectileHitsEntity(p, character!)
        );
        // Drop enemies the combat system killed
        enemies = enemies.filter((e) => e.isAlive());

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

        // Draw character
        if (character) {
            if (invincible) ctx.globalAlpha = 0.5;
            character.draw(ctx);
            ctx.globalAlpha = 1;
        }

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

        // Draw player projectiles
        ctx.fillStyle = '#2563eb';
        for (const p of playerProjectiles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
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
        ctx.fillText(`player projectiles: ${playerProjectiles.length}`, 5, 45);
        ctx.fillText(`enemy projectiles: ${enemyProjectiles.length}`, 5, 60);
        if (character) ctx.fillText(`player lives: ${character.lives}`, 5, 75);
        ctx.fillText(`score: ${stats.score}`, 5, 90);
        ctx.fillText(`kills: ${stats.kills}`, 5, 105);
        ctx.fillText(`combo: ${stats.combo}`, 5, 120);
    }

    $effect(() => {
        if (canvas) {
            canvas.width = W;
            canvas.height = H;
        }

        character = new Mage(W / 2, H / 2);
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

<h1 class="text-6xl my-4 text-center">Combat Debug</h1>

<div class="flex w-fit mx-auto rounded-md overflow-hidden border border-(--border-color)">
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
                <h3 class="text-lg font-bold mb-2">Combat</h3>
                <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span>Score</span><span class="text-right text-(--text-color)">{stats.score}</span>
                    <span>Kills</span><span class="text-right text-(--text-color)">{stats.kills}</span>
                    <span>Combo</span><span class="text-right text-(--text-color)">{stats.combo}</span>
                    <span>Lives</span><span class="text-right text-(--text-color)">{character?.lives ?? 0}</span>
                    <span>Time</span><span class="text-right text-(--text-color)">{timeAlive.toFixed(1)}s</span>
                </div>
            </div>
    </div>
    <canvas bind:this={canvas}></canvas>
</div>
