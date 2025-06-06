<script lang="ts">
  import moment from 'moment';
  import { createEventDispatcher, onMount } from 'svelte';
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
  }

  let { tasks, trackings, trackedWeek = $bindable() }: Props = $props();

  let onlyFilteredTasks: boolean = $state(false);

  let starred: string[] = $state([]);

  let filterMode: 'task' | 'usage' = $state('usage');

  const dispatch = createEventDispatcher();

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
    dispatch('addTrack', { task, time, day: date });
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
    dispatch('updateTrack', { track, time });
  }

  function deleteTrack(interval: Interval) {
    dispatch('deleteTrack', interval);
  }
</script>

<div class="timesheet">
  <div class="fixed top-28 left-0 w-full z-10 bg-screen px-5 pt-4">
    <WeekFilter bind:trackedWeek on:changeWeek />
    <TimetrackHeader
      {trackedWeek}
      {trackings}
      {filterMode}
      {onlyFilteredTasks}
      taskIds={tasks.map((t) => t.id)}
      on:toggleFilterMode={toggleFilterMode}
      on:updateOnlyFiltered={(e) => updateOnlyFiltered(e.detail)}
      on:update={(e) => editTrack(e.detail.track, e.detail.time)}
      on:delete={(e) => deleteTrack(e.detail)}
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
        on:star={() => star(task.id)}
        on:updateTrack={(e) =>
          updateTrack(e.detail.task, e.detail.day, e.detail.time)}
        on:deleteTrack={(e) => deleteTrack(e.detail)}
      />
    {/each}
  </div>
</div>
