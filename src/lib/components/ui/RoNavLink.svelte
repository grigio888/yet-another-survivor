<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        href: string;
        active?: boolean;
        class?: string;
        children: Snippet;
    }

    let { href, active = false, class: className = '', children }: Props = $props();

    const activeClass =
        'border-[#a8c8f0] bg-gradient-to-b from-[#6ea3dc] to-[#4d7eb8] text-[#fff8eb] shadow-[inset_0_2px_0_rgba(255,255,255,0.4),0_3px_0_rgba(42,79,124,0.18)]';
    const idleClass =
        'border-[#a8c8f0]/70 bg-[#e8f2fc] text-[var(--ro-text,#2a4f7c)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] hover:brightness-[1.03]';
</script>

<a
    {href}
    class="rounded-xl border-2 px-3 py-1.5 text-xs font-bold tracking-wide transition-[filter,transform] active:translate-y-px {active
        ? activeClass
        : idleClass} {className}"
    aria-current={active ? 'page' : undefined}
>
    {@render children()}
</a>
