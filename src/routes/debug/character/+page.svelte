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

    function draw() {
        const ctx = canvas?.getContext('2d');
        if (!ctx || !character) return;

        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, W, H);

        if (invincible) {
            ctx.globalAlpha = 0.5;
        }

        character.draw(ctx);
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

        if (invincible) ctx.font = '14px monospace';
        if (invincible) ctx.fillText('INVULNERABLE', character.x + 20, character.y);

        ctx.fillStyle = '#ff0';
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


