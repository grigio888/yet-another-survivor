<script>
	let { children } = $props();
</script>

<header
    class="sticky top-0 z-30 flex items-center justify-between border-b border-(--border-color) bg-(--header-color) p-4 text-(--background-color) shadow-(--shadow-color)"
>
    <h1 class="text-xl font-bold">
        <a href="/debug">Debug</a>
    </h1>
    <nav>
        <ul class="flex gap-4">
            {#each ['character', 'enemies', 'combat'] as page}
                <li>
                    <a
                        href={`/debug/${page}`}
                        class="transition-colors duration-200 hover:text-(--theme-color-600) hover:underline"
                    >
                        {page.charAt(0).toUpperCase() + page.slice(1)}
                    </a>
                </li>
            {/each}
        </ul>
    </nav>
</header>

<div class="h-[calc(100dvh-4.5rem)] min-h-0 w-full">
    {@render children()}
</div>
