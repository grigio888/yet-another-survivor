<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        title?: string;
        class?: string;
        bodyClass?: string;
        children: Snippet;
    }

    let { title, class: className = '', bodyClass = '', children }: Props = $props();
</script>

<div
    class="ro-window relative flex min-h-0 flex-col rounded-[var(--ro-radius)] shadow-[0_6px_0_rgba(42,79,124,0.18),0_8px_24px_rgba(42,79,124,0.22)] {className}"
    role="group"
    aria-label={title}
>
    <!-- Outer bevel -->
    <div
        class="flex min-h-0 flex-1 flex-col rounded-[var(--ro-radius)] border-2 border-[#a8c8f0] bg-gradient-to-b from-[#8eb6e8] via-[#6ea3dc] to-[#4d7eb8] p-[3px] shadow-[inset_0_2px_0_rgba(255,255,255,0.55)]"
    >
        <!-- Inner frame — blank body -->
        <div
            class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[calc(var(--ro-radius)-3px)] border border-[#8eb6e8]/45 bg-[var(--ro-body-bg)] shadow-[inset_0_1px_3px_rgba(42,79,124,0.06)]"
        >
            {#if title}
                <div
                    class="shrink-0 border-b border-[#8eb6e8]/50 bg-gradient-to-b from-[#6ea3dc] via-[#5a8fc8] to-[#4d7eb8] px-3 py-1.5 text-center shadow-[inset_0_2px_0_rgba(255,255,255,0.45),inset_0_-1px_0_rgba(42,79,124,0.12)]"
                >
                    <span
                        class="text-xs font-bold tracking-widest text-[#fff8eb] drop-shadow-[0_1px_0_rgba(42,79,124,0.45)]"
                    >
                        {title}
                    </span>
                </div>
            {/if}

            <div
                class="min-h-0 flex-1 overflow-y-auto bg-[var(--ro-body-bg)] p-3 text-sm text-[var(--ro-text)] {bodyClass}"
            >
                {@render children()}
            </div>
        </div>
    </div>
</div>
