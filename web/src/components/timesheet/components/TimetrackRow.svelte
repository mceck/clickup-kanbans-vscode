<script lang="ts">
  // import { createEventDispatcher } from 'svelte';
  import Icon from '../../commons/Icon.svelte';
  import type { Interval, Task } from '../../../interfaces/clickup';
  import TimetrackCell from './TimetrackCell.svelte';
  import { FERIAL_DAYS, totalForTaskDay } from '../tracking-utils';

  interface Props {
    trackedWeek: string;
    task: Task;
    starred: string[];
    trackings: Interval[];
    onStar?: () => void;
    onUpdateTrack?: (event: { task: Task; day: number; time: number }) => void;
  }

  let {
    trackedWeek,
    task,
    starred,
    trackings,
    onStar,
    onUpdateTrack
  }: Props = $props();

  // const dispatch = createEventDispatcher();
</script>

<div class="flex w-full items-center py-4 border-b border-neutral-800">
  <button class="w-1/12 bg-transparent border-none p-0 cursor-pointer focus:outline-none" onclick={() => onStar?.()}>
    <Icon
      name={starred.includes(task.id) ? 'star' : 'star-empty'}
      class="w-6"
    />
  </button>
  <a class="w-6/12" href={task.url}>{task.name}</a>
  {#each FERIAL_DAYS as day}
    <TimetrackCell
      totalForDay={totalForTaskDay(trackings, task.id, day, trackedWeek)}
      onUpdateTrack={(time) =>
        onUpdateTrack?.({ task, day, time })}
    />
  {/each}
</div>
