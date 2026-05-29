<script lang="ts">
    import { Character } from '$lib/game/entities/Character';
    import { PLAYER, CANVAS } from '$lib/game/config';

    let canvas: HTMLCanvasElement | null = $state(null);
    let character: Character | null = $state(null);
    let frameId = $state(0);
    let lastTime = $state(0);
    let keys = $state(new Set<string>());
    let movement = $state({ dx: 0, dy: 0, sprint: false });
    let invincible = $state(false);
    let timeAlive = $state(0);
    // Last snapped 8-way facing; persists while idle
    let facing = $state({ dx: 0, dy: 1 });

    const W = CANVAS.width;
    const H = CANVAS.height;

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

    function snapEightDirection(dx: number, dy: number): { dx: number; dy: number } {
        const sx = Math.sign(dx);
        const sy = Math.sign(dy);
        if (sx === 0) return { dx: 0, dy: sy };
        if (sy === 0) return { dx: sx, dy: 0 };
        const inv = 1 / Math.SQRT2;
        return { dx: sx * inv, dy: sy * inv };
    }

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
            character.hp = character.maxHp;
            character.lives = PLAYER.maxLives;
        }
    }

    function resetCharacter() {
        character = new Character({ x: W / 2, y: H / 2 });
        facing = { dx: 0, dy: 1 };
        timeAlive = 0;
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
        frameId = requestAnimationFrame(loop);
    }

    function drawCharacterThreeQuarter(ctx: CanvasRenderingContext2D, c: Character) {
        const { x, y, size, color } = c;
        const r = size / 2;
        const bodyW = r * 1.05;
        const bodyH = r * 1.15;
        const headR = r * 0.42;

        // Ground shadow — anchor point for the 3/4 view
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.55, bodyW * 0.95, r * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs / lower body (slightly toward camera / bottom of screen)
        ctx.fillStyle = shadeColor(color, -28);
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.28, bodyW * 0.72, r * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();

        // Torso — tapered so the top reads narrower (light 3/4 angle)
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x - bodyW * 0.62, y + r * 0.05);
        ctx.lineTo(x + bodyW * 0.62, y + r * 0.05);
        ctx.lineTo(x + bodyW * 0.48, y - bodyH * 0.55);
        ctx.lineTo(x - bodyW * 0.48, y - bodyH * 0.55);
        ctx.closePath();
        ctx.fill();

        // Shoulder highlight on the lit side
        ctx.fillStyle = shadeColor(color, 18);
        ctx.beginPath();
        ctx.ellipse(x + bodyW * 0.18, y - r * 0.08, r * 0.28, r * 0.18, -0.35, 0, Math.PI * 2);
        ctx.fill();

        // Head sits above torso, offset slightly toward the camera
        ctx.fillStyle = shadeColor(color, 12);
        ctx.beginPath();
        ctx.arc(x, y - bodyH * 0.72, headR, 0, Math.PI * 2);
        ctx.fill();

        // Gun/arm points in the last snapped 8-way facing direction
        const nx = facing.dx;
        const ny = facing.dy;
        const gunX = x + nx * r * 0.55;
        const gunY = y - r * 0.05 + ny * r * 0.55;

        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x + nx * r * 0.15, y + ny * r * 0.05);
        ctx.lineTo(gunX, gunY);
        ctx.stroke();

        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(gunX, gunY, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }

    function shadeColor(hex: string, amount: number): string {
        const n = parseInt(hex.replace('#', ''), 16);
        const r = Math.min(255, Math.max(0, (n >> 16) + amount));
        const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amount));
        const b = Math.min(255, Math.max(0, (n & 0xff) + amount));
        return `rgb(${r}, ${g}, ${b})`;
    }

    function drawGround(ctx: CanvasRenderingContext2D) {
        const tile = 48;

        // Soft base gradient — slightly darker toward the bottom (camera side)
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#f1f5f9');
        grad.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Subtle checker tiles — reads as a floor without forced perspective
        for (let ty = 0; ty < H + tile; ty += tile) {
            for (let tx = 0; tx < W + tile; tx += tile) {
                const even = ((tx / tile) + (ty / tile)) % 2 === 0;
                ctx.fillStyle = even ? 'rgba(255, 255, 255, 0.35)' : 'rgba(148, 163, 184, 0.08)';
                ctx.fillRect(tx, ty, tile, tile);
            }
        }

        // Light grid lines on top
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

        drawCharacterThreeQuarter(ctx, character);
        ctx.globalAlpha = 1;

        ctx.fillStyle = '#000';
        ctx.font = '12px Poppins, sans-serif';
        ctx.fillText(`pos: (${character.x.toFixed(1)}, ${character.y.toFixed(1)})`, 5, 15);
        ctx.fillText(`hp: ${character.hp} / ${character.maxHp}`, 5, 30);
        ctx.fillText(`lives: ${character.lives}`, 5, 45);
        ctx.fillText(`invincible: ${invincible}`, 5, 60);
        ctx.fillText(`lastShot: ${character.lastShot.toFixed(0)}ms`, 5, 75);
        ctx.fillText(`speed: ${movement.sprint ? PLAYER.speed * 2 : PLAYER.speed}`, 5, 90);
        ctx.fillText(`time: ${timeAlive.toFixed(1)}s`, 5, 105);
        ctx.fillText(`view: light 3/4 top-down`, 5, 120);
        ctx.fillText(`facing: ${facingLabel()}`, 5, 135);

        if (invincible) {
            ctx.font = '14px monospace';
            ctx.fillText('INVULNERABLE', character.x + 20, character.y);
        }

        // Foot anchor / collision center
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(character.x - 1, character.y - 1, 2, 2);
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

<h1 class="text-6xl my-4 text-center">
    Character Debug
</h1>

<div class="flex w-fit mx-auto rounded-md overflow-hidden border border-(--border-color)">
    <div
        class="flex flex-col justify-between gap-2 p-4 w-64 border-r border-(--border-color)"
    >
        <div class="flex flex-col gap-2">
            <h3 class="text-lg font-bold mb-2">Controls</h3>
            <p class="text-sm text-gray-500">WASD/Arrows: Move</p>
            <p class="text-sm text-gray-500">Shift: Sprint (2x speed)</p>
            <p class="text-sm text-gray-500">View: light 3/4 top-down (debug render)</p>
            <button class="bg-(--theme-color-600) text-white px-4 py-2 rounded-md hover:bg-(--theme-color-700) transition-colors duration-200" onclick={takeDamage}>Take Damage (-1 life)</button>
            <button class="bg-(--theme-color-600) text-white px-4 py-2 rounded-md hover:bg-(--theme-color-700) transition-colors duration-200" onclick={healFull}>Full Heal</button>
            <button class="bg-(--theme-color-600) text-white px-4 py-2 rounded-md hover:bg-(--theme-color-700) transition-colors duration-200" onclick={resetCharacter}>Reset</button>
        </div>
        <div class="flex flex-col gap-2">
            <h3 class="text-lg font-bold mb-2">Stats</h3>
            <p class="text-sm text-gray-500">Max Lives: {PLAYER.maxLives}</p>
            <p class="text-sm text-gray-500">Speed: {PLAYER.speed} px/s</p>
            <p class="text-sm text-gray-500">Shoot cooldown: {PLAYER.shootCooldown}ms</p>
            <p class="text-sm text-gray-500">Invuln: {PLAYER.invincibleFrames}ms</p>
        </div>
    </div>
    <canvas
        bind:this={canvas}
    ></canvas>
</div>


