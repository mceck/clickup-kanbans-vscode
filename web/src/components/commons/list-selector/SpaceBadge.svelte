<script lang="ts">
  import type { Space } from '../../../interfaces/clickup';

  interface Props {
    space: Space;
  }

  let { space }: Props = $props();

  let initial = $derived(space.name.slice(0, 1));
</script>

<div
  class="flex justify-center items-center flex-none rounded-sm"
  style={`background-color: ${space.color ?? '#3794ff'}`}
>
  <span class="uppercase text-white">{initial}</span>
</div>
