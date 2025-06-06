<script lang="ts">
  import moment from 'moment';
  import { onMount } from 'svelte';
  import type { Interval, Task } from '../../interfaces/clickup';
  import clickupService from '../../services/clickup-service';
  import WeekFilter from './components/WeekFilter.svelte';
  import TimetrackHeader from './components/TimetrackHeader.svelte';
  import TimetrackRow from './components/TimetrackRow.svelte';
  import { sortTasks, totalForTaskDay } from './tracking-utils';


  interface Props {
    tasks: Task[];
    trackings: Interval[];
    trackedWeek: string;
    onAddTrack?: (detail: { task: Task; time: number; day: number }) => void;
    onUpdateTrack?: (detail: { track: Interval; time: number }) => void;
    onDeleteTrack?: (interval: Interval) => void;
  }

  let {
    tasks,
    trackings,
    trackedWeek = $bindable(),
    onAddTrack,
    onUpdateTrack,
    onDeleteTrack,
  }: Props = $props();

  let onlyFilteredTasks: boolean = $state(false);

  let starred: string[] = $state([]);

  let filterMode: 'task' | 'usage' = $state('usage');

  let sortedTasks = $derived(sortTasks(tasks, starred, trackings, filterMode));

  onMount(async () => {
    let r = await clickupService.getCache('starred');
    starred = r?.data ?? [];
    r = await clickupService.getCache('onlyFilteredTasks');
    onlyFilteredTasks = !!r.data;
  });

  function updateTrack(task: Task, day: number, newTime: number) {
    const time =
      newTime - totalForTaskDay(trackings, task.id, day, trackedWeek);
    const date = moment(trackedWeek).add(day, 'days').startOf('day').valueOf();
    onAddTrack?.({ task, time, day: date });
  }

  async function star(taskId: string) {
    if (starred.includes(taskId)) {
      starred = starred.filter((t) => t !== taskId);
    } else {
      starred = [...starred, taskId];
    }
    await clickupService.setCache('starred', starred);
  }

  function updateOnlyFiltered(value: boolean) {
    onlyFilteredTasks = value;
    clickupService.setCache('onlyFilteredTasks', value);
  }

  function toggleFilterMode() {
    filterMode = filterMode === 'task' ? 'usage' : 'task';
  }

  function editTrack(track: Interval, time: number) {
    onUpdateTrack?.({ track, time });
  }

  function deleteTrack(interval: Interval) {
    onDeleteTrack?.(interval);
  }
</script>

<div class="timesheet">
  <div class="fixed top-28 left-0 w-full z-10 bg-screen px-5 pt-4">
    <WeekFilter bind:trackedWeek />
    <TimetrackHeader
      {trackedWeek}
      {trackings}
      {filterMode}
      {onlyFilteredTasks}
      taskIds={tasks.map((t) => t.id)}
      onToggleFilterMode={toggleFilterMode}
      onUpdateOnlyFiltered={updateOnlyFiltered}
      onUpdate={(event) => editTrack(event.track, event.time)}
      onDelete={deleteTrack}
    />
  </div>
  <div class="h-28"></div>
  <div>
    {#each sortedTasks as task (task.id)}
      <TimetrackRow
        {trackedWeek}
        {trackings}
        {task}
        {starred}
        onStar={() => star(task.id)}
        onUpdateTrack={(event) =>
          updateTrack(event.task, event.day, event.time)}
      />
    {/each}
  </div>
</div>
