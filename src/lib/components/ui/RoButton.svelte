<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        type?: 'button' | 'submit' | 'reset';
        disabled?: boolean;
        class?: string;
        onclick?: (event: MouseEvent) => void;
        children: Snippet;
    }

    let {
        type = 'button',
        disabled = false,
        class: className = '',
        onclick,
        children,
    }: Props = $props();

    const baseClass =
        'rounded-xl border-2 border-[#a8c8f0] bg-gradient-to-b from-[#6ea3dc] to-[#4d7eb8] px-4 py-2 text-xs font-bold tracking-wide text-[#fff8eb] shadow-[inset_0_2px_0_rgba(255,255,255,0.4),0_3px_0_rgba(42,79,124,0.18)] transition-[filter,transform] hover:brightness-105 active:translate-y-px active:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_0_rgba(42,79,124,0.15)] disabled:cursor-not-allowed disabled:opacity-50';
</script>

<button {type} {disabled} class="{baseClass} {className}" {onclick}>
    {@render children()}
</button>
