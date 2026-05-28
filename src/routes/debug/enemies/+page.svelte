<script lang="ts">
    import { Character } from '$lib/game/entities/Character';
    import { Grunt } from '$lib/game/entities/Grunt';
    import { Shooter } from '$lib/game/entities/Shooter';
    import { Chief } from '$lib/game/entities/Chief';
    import { ENEMIES, CANVAS } from '$lib/game/config';

    let canvas: HTMLCanvasElement | null = $state(null);
    let character: Character | null = $state(null);
    let enemies = $state([]);
    let projectiles = $state([]);
    let frameId = $state(0);
    let lastTime = $state(0);
    let keys = $state(new Set<string>());
    let movement = $state({ dx: 0, dy: 0, sprint: false });
    let invincible = $state(false);
    let timeAlive = $state(0);

    const enemyClasses = [
        { label: 'Grunt', cls: Grunt },
        { label: 'Shooter', cls: Shooter },
        { label: 'Chief', cls: Chief },
    ];

    const W = CANVAS.width;
    const H = CANVAS.height;

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
        projectiles = [];
        if (character) {
            character.hp = character.maxHp;
            character.lives = PLAYER.maxLives;
        }
        timeAlive = 0;
    }

    function loop(now: number) {
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        timeAlive += dt;

        if (character) character.update(dt, movement);
        invincible = character?.isInvincible() ?? false;

        // Update enemies, filter dead ones, collect new projectiles
        const newProjectiles = [];
        enemies = enemies.filter(e => e.isAlive());
        for (const e of enemies) {
            const result = e.update(dt, character!.x, character.y);
            if (result) {
                newProjectiles.push({
                    x: result.x, y: result.y,
                    dx: result.direction.dx, dy: result.direction.dy,
                    speed: result.speed, damage: result.damage,
                    type: 'enemy', alive: true,
                });
            }
        }
        projectiles = projectiles.filter(p => p.alive).concat(newProjectiles);

        // Move projectiles toward character
        for (const p of projectiles) {
            p.x += p.dx * p.speed * dt;
            p.y += p.dy * p.speed * dt;
            const dx = character!.x - p.x;
            const dy = character!.y - p.y;
            if (dx * dx + dy * dy > ENEMIES.shooter.range * ENEMIES.shooter.range * 4) {
                p.alive = false;
            }
        }

        // Check colliding projectiles vs character
        for (const p of projectiles) {
            if (
                p.alive && character &&
                Math.abs(p.x - character.x) < character.size &&
                Math.abs(p.y - character.y) < character.size
            ) {
                character.takeDamage(p.damage);
                p.alive = false;
            }
        }

        // Check enemy-character collision
        if (character) {
            for (const e of enemies) {
                if (e.collidesWith(character)) {
                    character.takeDamage(e.damage);
                }
            }
        }

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

        // Draw projectiles
        for (const p of projectiles) {
            if (p.alive) {
                ctx.fillStyle = '#f97316';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Debug overlay
        ctx.fillStyle = '#000';
        ctx.font = '12px monospace';
        ctx.fillText(`time: ${timeAlive.toFixed(1)}s`, 5, 15);
        ctx.fillText(`enemies: ${enemies.length}`, 5, 30);
        ctx.fillText(`projectiles: ${projectiles.filter(p => p.alive).length}`, 5, 45);
        if (character) ctx.fillText(`player lives: ${character.lives}`, 5, 60);
    }

    $effect(() => {
        if (canvas) {
            canvas.width = W;
            canvas.height = H;
        }

        character = new Character({ x: W / 2, y: H / 2 });
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
                <h3 class="text-lg font-bold mb-2">Movement</h3>
                <p class="text-sm text-gray-500">WASD/Arrows: Move player</p>
                <p class="text-sm text-gray-500">Shift: Sprint</p>
            </div>
    </div>
    <canvas bind:this={canvas}></canvas>
</div>

