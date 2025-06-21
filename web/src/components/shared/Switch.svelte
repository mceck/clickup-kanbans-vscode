<script lang="ts">
  interface Props {
    value?: boolean;
    onChange?: (newValue: boolean) => void;
  }

  let { value = false, onChange }: Props = $props();
</script>

<span
  class="cursor-pointer w-9 h-5 inline-flex px-1 border rounded-full items-center transition-colors {value
    ? 'border-primary'
    : 'border-neutral-500'}"
  onclick={() => onChange?.(!value)}
>
  <span
    class="w-3 h-3 flex-none rounded-full transition-all {value
      ? 'translate-x-full bg-primary'
      : 'bg-neutral-500'}"
></span>
</span>
