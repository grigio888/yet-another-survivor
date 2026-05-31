<script lang="ts">
    import { page } from '$app/state';
    import { RoNavLink } from '$lib/components/ui';

    const pages = [
        { slug: 'character', label: 'Character' },
        { slug: 'enemies', label: 'Enemies' },
        { slug: 'combat', label: 'Combat' },
    ] as const;

    function isActive(slug: string): boolean {
        return (
            page.url.pathname === `/debug/${slug}` ||
            page.url.pathname.startsWith(`/debug/${slug}/`)
        );
    }
</script>

<header
    class="shrink-0 border-b-2 border-[#8eb6e8] bg-[#fffefb] px-4 py-2.5"
>
    <div class="flex flex-wrap items-center justify-between gap-3">
        <a
            href="/debug"
            class="text-sm font-bold tracking-wide text-[#17365a] transition-[filter] hover:brightness-110"
        >
            Debug
        </a>
        <nav aria-label="Debug pages">
            <ul class="flex flex-wrap gap-2">
                {#each pages as entry (entry.slug)}
                    <li>
                        <RoNavLink href={`/debug/${entry.slug}`} active={isActive(entry.slug)}>
                            {entry.label}
                        </RoNavLink>
                    </li>
                {/each}
            </ul>
        </nav>
    </div>
</header>
