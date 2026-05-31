<script lang="ts">
    import type { ItemInventory } from '$lib/game/items/Inventory';
    import type { ItemDefinition } from '$lib/game/items/types';
    import { MAX_ACTIVE_ITEMS, MAX_PASSIVE_ITEMS } from '$lib/game/items';

    interface Props {
        inventory: ItemInventory;
        class?: string;
        showLabels?: boolean;
    }

    let { inventory, class: className = '', showLabels = true }: Props = $props();

    const activeSlots = $derived(inventory.getActiveSlots());
    const passiveSlots = $derived(inventory.getPassiveSlots());

    function itemInitial(item: ItemDefinition): string {
        return item.name.charAt(0).toUpperCase();
    }
</script>

<div
    class="flex flex-col gap-3 rounded-md border border-(--theme-color-600)/65 bg-(--background-color)/25 p-3 backdrop-blur-sm {className}"
>
    <section class="flex flex-col gap-1.5" data-kind="active">
        {#if showLabels}
            <header
                class="flex items-baseline justify-between gap-2 text-xs uppercase tracking-wide text-(--text-color-muted)"
            >
                <span class="font-semibold text-(--text-color)">Active</span>
                <span>{inventory.getActiveCount()}/{MAX_ACTIVE_ITEMS}</span>
            </header>
        {/if}
        <ul class="grid list-none grid-cols-4 gap-1.5 p-0 m-0" aria-label="Active items">
            {#each activeSlots as item, index (index)}
                <li
                    class="flex min-h-14 aspect-square flex-col items-center justify-center gap-1 rounded-md p-1 {item
                        ? 'border border-solid border-(--theme-color-600)/55 bg-(--theme-color-200)/40'
                        : 'border border-dashed border-(--theme-color-600)/45 bg-(--bg-color-200)/35'}"
                    data-slot={index}
                    data-kind="active"
                    title={item?.description ?? 'Empty active slot'}
                >
                    {#if item}
                        {#if item.sprite?.url}
                            <img
                                class="h-7 w-7 object-contain [image-rendering:pixelated] rotate-90"
                                src={item.sprite.url}
                                alt={item.name}
                            />
                        {:else}
                            <span
                                class="grid h-7 w-7 place-items-center rounded-full bg-(--theme-color-500)/35 text-xs font-bold text-(--text-color)"
                                aria-hidden="true"
                            >
                                {itemInitial(item)}
                            </span>
                        {/if}
                        <span
                            class="max-w-full truncate text-center text-[0.625rem] leading-tight text-(--text-color-muted)"
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
                class="flex items-baseline justify-between gap-2 text-xs uppercase tracking-wide text-(--text-color-muted)"
            >
                <span class="font-semibold text-(--text-color)">Passive</span>
                <span>{inventory.getPassiveCount()}/{MAX_PASSIVE_ITEMS}</span>
            </header>
        {/if}
        <ul class="grid list-none grid-cols-4 gap-1.5 p-0 m-0" aria-label="Passive items">
            {#each passiveSlots as item, index (index)}
                <li
                    class="flex min-h-14 aspect-square flex-col items-center justify-center gap-1 rounded-md p-1 {item
                        ? 'border border-solid border-(--theme-color-600)/55 bg-(--theme-color-200)/40'
                        : 'border border-dashed border-(--theme-color-600)/45 bg-(--bg-color-200)/35'}"
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
                                class="grid h-7 w-7 place-items-center rounded-full bg-(--theme-color-500)/35 text-xs font-bold text-(--text-color)"
                                aria-hidden="true"
                            >
                                {itemInitial(item)}
                            </span>
                        {/if}
                        <span
                            class="max-w-full truncate text-center text-[0.625rem] leading-tight text-(--text-color-muted)"
                        >
                            {item.name}
                        </span>
                    {/if}
                </li>
            {/each}
        </ul>
    </section>
</div>
