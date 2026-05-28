<script>
	let { children } = $props();
</script>

<header
    class="sticky top-0 z-10 bg-(--header-color) text-(--text-color) border-(--border-color)
    border-b p-4 flex justify-between items-center shadow-(--shadow-color)"
>
    <h1 class="text-xl font-bold">
        <a href="/debug">Debug</a>
    </h1>
    <nav>
        <ul class="flex gap-4">
            {#each ['character', 'enemies'] as page}
                <li>
                    <a
                        href={`/debug/${page}`}
                        class="hover:text-(--theme-color-600) hover:underline transition-colors
                        duration-200"
                    >
                        {page.charAt(0).toUpperCase() + page.slice(1)}
                    </a>
                </li>
            {/each}
        </ul>
    </nav>
</header>

<div class="p-4">
    {@render children()}
</div>
