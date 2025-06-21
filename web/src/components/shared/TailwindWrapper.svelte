<script lang="ts">
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

{@render children?.()}

<style global lang="postcss">
  @import 'tailwindcss';

  button:disabled {
    @apply text-neutral-500 cursor-not-allowed;
  }
  /* button:hover:disabled {
    @apply bg-screen;
  } */

  .link {
    @apply text-sky-600;
  }
</style>
