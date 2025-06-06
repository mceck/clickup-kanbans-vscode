<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  interface Props {
    value?: boolean;
  }

  let { value = false }: Props = $props();

  const dispatch = createEventDispatcher();
</script>

<span
  class="cursor-pointer w-9 h-5 inline-flex px-1 border rounded-full items-center transition-colors {value
    ? 'border-primary'
    : 'border-neutral-500'}"
  onclick={() => dispatch('change', !value)}
>
  <span
    class="w-3 h-3 flex-none rounded-full transition-all {value
      ? 'translate-x-full bg-primary'
      : 'bg-neutral-500'}"
></span>
</span>
