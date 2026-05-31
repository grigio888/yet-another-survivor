<script lang="ts">
    import type { ItemInventory } from '$lib/game/items/Inventory';
    import type { ItemDefinition } from '$lib/game/items/types';
    import { MAX_ACTIVE_ITEMS, MAX_PASSIVE_ITEMS } from '$lib/game/items';

    interface Props {
        inventory: ItemInventory;
        class?: string;
        showLabels?: boolean;
        bare?: boolean;
    }

    let { inventory, class: className = '', showLabels = true, bare = false }: Props = $props();

    const activeSlots = $derived(inventory.getActiveSlots());
    const passiveSlots = $derived(inventory.getPassiveSlots());

    const rootClass = bare
        ? 'flex flex-col gap-3'
        : 'flex flex-col gap-3 rounded-md border border-(--border-color)/65 bg-(--background-color)/80 p-3 backdrop-blur-sm';

    function itemInitial(item: ItemDefinition): string {
        return item.name.charAt(0).toUpperCase();
    }
</script>

<div class="{rootClass} {className}">
    <section class="flex flex-col gap-1.5" data-kind="active">
        {#if showLabels}
            <header
                class="flex items-baseline justify-between gap-2 text-xs uppercase tracking-wide ro-muted"
            >
                <span class="font-semibold text-[var(--ro-text)]">Active</span>
                <span>{inventory.getActiveCount()}/{MAX_ACTIVE_ITEMS}</span>
            </header>
        {/if}
        <ul class="grid list-none grid-cols-4 gap-1.5 p-0 m-0" aria-label="Active items">
            {#each activeSlots as item, index (index)}
                <li
                    class="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl p-1 {item
                        ? 'border border-solid border-[#8eb6e8]/80 bg-[#e8f2fc]'
                        : 'border border-dashed border-[#a8c8f0]/70 bg-[#f5f9ff]'}"
                    data-slot={index}
                    data-kind="active"
                    title={item?.description ?? 'Empty active slot'}
                >
                    {#if item}
                        {#if item.sprite?.url}
                            <img
                                class="h-7 w-7 object-contain [image-rendering:pixelated]"
                                src={item.sprite.url}
                                alt={item.name}
                            />
                        {:else}
                            <span
                                class="grid h-7 w-7 place-items-center rounded-full bg-[#6ea3dc]/35 text-xs font-bold text-[var(--ro-text-strong,#17365a)]"
                                aria-hidden="true"
                            >
                                {itemInitial(item)}
                            </span>
                        {/if}
                        <span
                            class="max-w-full truncate text-center text-[0.625rem] leading-tight ro-muted"
                        >
                            {item.name}
                        </span>
                    {/if}
                </li>
            {/each}
        </ul>
    </section>

    <section class="flex flex-col gap-1.5" data-kind="passive">
        {#if showLabels}
            <header
                class="flex items-baseline justify-between gap-2 text-xs uppercase tracking-wide ro-muted"
            >
                <span class="font-semibold text-[var(--ro-text)]">Passive</span>
                <span>{inventory.getPassiveCount()}/{MAX_PASSIVE_ITEMS}</span>
            </header>
        {/if}
        <ul class="grid list-none grid-cols-4 gap-1.5 p-0 m-0" aria-label="Passive items">
            {#each passiveSlots as item, index (index)}
                <li
                    class="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl p-1 {item
                        ? 'border border-solid border-[#8eb6e8]/80 bg-[#e8f2fc]'
                        : 'border border-dashed border-[#a8c8f0]/70 bg-[#f5f9ff]'}"
                    data-slot={index}
                    data-kind="passive"
                    title={item?.description ?? 'Empty passive slot'}
                >
                    {#if item}
                        {#if item.sprite?.url}
                            <img
                                class="h-7 w-7 object-contain [image-rendering:pixelated]"
                                src={item.sprite.url}
                                alt={item.name}
                            />
                        {:else}
                            <span
                                class="grid h-7 w-7 place-items-center rounded-full bg-[#6ea3dc]/35 text-xs font-bold text-[var(--ro-text-strong,#17365a)]"
                                aria-hidden="true"
                            >
                                {itemInitial(item)}
                            </span>
                        {/if}
                        <span
                            class="max-w-full truncate text-center text-[0.625rem] leading-tight ro-muted"
                        >
                            {item.name}
                        </span>
                    {/if}
                </li>
            {/each}
        </ul>
    </section>
</div>
