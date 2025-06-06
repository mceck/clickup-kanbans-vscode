<script lang="ts">
  import EditTracking from '../../commons/EditTracking.svelte';
  import type { Interval } from '../../../interfaces/clickup';
  import { outsideClickable } from '../../utils/clickOutside';

  interface Props {
    hasAtLeastEightHours: boolean;
    onlyFilteredTasks: boolean;
    hours: string;
    intervals: any;
    onUpdate?: (event: { track: Interval; time: number }) => void;
    onDelete?: (track: Interval) => void;
  }

  let { hasAtLeastEightHours, onlyFilteredTasks, hours, intervals, onUpdate, onDelete }: Props =
    $props();
  let edit: boolean = $state(false);
</script>

<p
  class="w-1/12 relative {hasAtLeastEightHours
    ? 'text-green-500'
    : 'text-red-400'} {!onlyFilteredTasks && 'cursor-pointer'}"
  use:outsideClickable
  onclickOutside={() => (edit = false)}
  onclick={() => (edit = !edit)}
>
  {hours}
  {#if edit}
    <EditTracking
      class="w-[450px] right-1/2 max-h-56 text-white"
      showTask={true}
      {intervals}
      onUpdate={onUpdate}
      onDelete={onDelete}
    />
  {/if}
</p>
