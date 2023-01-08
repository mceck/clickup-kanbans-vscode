<script lang="ts">
  import moment from 'moment';

  import { createEventDispatcher } from 'svelte';

  import type { Interval, Task, User } from '../interfaces/clickup';
  import ClickupService from '../services/clickup-service';
  import ActionBar from './ActionBar.svelte';
  import AssigneesSelector from './AssigneesSelector/AssigneesSelector.svelte';
  import TimeTrackInput from './TimeTrackInput.svelte';
  // @ts-ignore
  import TrashIcon from '../assets/trash.svg';
  // @ts-ignore
  import EditIcon from '../assets/edit.svg';
  // @ts-ignore
  import CopyIcon from '../assets/copy.svg';

  export let task: Task;
  export let statusKeys: string[];

  let timeTrackInput: HTMLInputElement;
  let timeTrackText: string = '';
  let showTracking = false;
  let editTrack: Interval;
  let intervals: Interval[] = [];

  const dispatch = createEventDispatcher();
  const service = new ClickupService();

  async function toggleTracks() {
    showTracking = !showTracking;
    if (showTracking && !intervals.length) {
      const res = await service.getTimeTracked(task.id);
      if (res.ok) {
        intervals = (res.ok && res.data[0]?.intervals) || [];
      }
    }
  }

  function showEditTrack(track: Interval) {
    if (editTrack) {
      editTrack = undefined;
      return;
    }
    editTrack = track;
    setTimeout(() => {
      timeTrackInput.focus();
      timeTrackInput.select();
    }, 0);
    const t = moment(parseInt(track.time as any))?.add(-1, 'hour');
    timeTrackText = t.format('HH') + 'h ' + t.format('mm') + 'm';
  }

  async function deleteTrack(track) {
    const result = await service.deleteTimeTracked(task.id, track.id);
    if (result.ok) {
      intervals = intervals.filter((i) => i.id !== track.id);
      const newTask = {
        ...task,
        time_spent: parseInt(task.time_spent as any) - parseInt(track.time),
      };
      if (intervals.length === 0) {
        showTracking = false;
      }
      dispatch('refresh', newTask);
      service.showToast('info', 'Tracking deleted');
    }
  }

  function toDate(time) {
    return moment(parseInt(time)).format('DD/MM/YYYY');
  }

  function toTime(time) {
    return moment(parseInt(time)).add(-1, 'hour').format('HH:mm');
  }

  async function updateTrack(interval, time: number) {
    editTrack = undefined;
    const result = await service.updateTimeTracked(task.id, interval.id, {
      start: interval.start,
      end: parseInt(interval.start) + time,
      time,
    });
    if (result.ok) {
      const newTask = {
        ...task,
        time_spent: (task.time_spent || 0) + time - parseInt(interval.time),
      };
      dispatch('refresh', newTask);
      showTracking = false;
      service.showStatusMessage('Time tracked');
    }
  }
  function copyCustomId() {
    navigator.clipboard
      .writeText(task.custom_id)
      .then(() => service.showStatusMessage('Copied'));
  }

  async function addAssignee(assignee: User) {
    const oldAssignees = [...task.assignees];
    task.assignees = [...task.assignees, assignee];
    try {
      const res = await service.updateTask(task.id, {
        assignees: { add: [assignee.id] },
      });
      if (!res.data?.assignees) {
        throw new Error();
      }
      task.assignees = res.data.assignees;
    } catch (e) {
      task.assignees = oldAssignees;
    }
  }

  async function removeAssignee(assignee: User) {
    const oldAssignees = [...task.assignees];
    task.assignees = task.assignees.filter((e) => e.id !== assignee.id);
    try {
      const res = await service.updateTask(task.id, {
        assignees: { rem: [assignee.id] },
      });
      if (!res.data?.assignees) {
        throw new Error();
      }
      task.assignees = res.data.assignees;
    } catch (e) {
      task.assignees = oldAssignees;
    }
  }
</script>

<svelte:window
  on:click={() => {
    showTracking = false;
    editTrack = undefined;
  }}
/>
<div
  class="px-2 pt-6 border border-gray-600 hover:border-gray-500 rounded-lg my-1 relative"
>
  <div class="h-16 flex flex-col overflow-auto">
    <div class="absolute top-1 right-1">
      <AssigneesSelector
        anchor="right"
        selectedAssignees={task.assignees}
        on:add={(e) => addAssignee(e.detail)}
        on:remove={(e) => removeAssignee(e.detail)}
        maxShown={4}
        small
        manual
      />
    </div>
    <div class="flex">
      {#each task.tags as tag (tag.name)}
        <span
          class="w-12 px-1 rounded text-xs text-white shadow overflow-ellipsis whitespace-nowrap overflow-hidden"
          style={`background-color: ${tag.tag_bg || '#1c1c1c'};`}
          title={tag.name}>{tag.name}</span
        >
      {/each}
    </div>
    <p>
      {task.name}
    </p>
    {#if task.time_estimate}
      <small
        class="text-sm absolute left-2 top-1 text-gray-400"
        title="Time estimated"
      >
        {(task.time_estimate / 3600000).toFixed(0)}h
      </small>
    {/if}
    {#if task.time_spent}
      <small
        class="text-sm absolute text-green-500 left-12 -ml-2 top-1 cursor-pointer"
        title="Time tracked"
        on:click|stopPropagation={toggleTracks}
      >
        {(task.time_spent / 3600000).toFixed(1)}h
      </small>
    {/if}
    {#if task.custom_id}
      <div
        class="left-20 -ml-1 top-1 cursor-pointer absolute flex items-center copy-hover"
      >
        <span class="opacity-0 transition-opacity">
          <CopyIcon class="w-3 text-yellow-100 stroke-current" />
        </span>
        <small
          class="text-sm  text-yellow-600 "
          on:click|stopPropagation={copyCustomId}
        >
          {task.custom_id}
        </small>
      </div>
    {/if}
  </div>
  <div class="w-full px-2 pb-2 rounded shadow">
    <ActionBar
      {task}
      statuses={statusKeys}
      on:refresh={(e) => dispatch('refresh', e.detail)}
    />
  </div>
  {#if showTracking}
    <div
      class="absolute w-4/5 max-h-24 top-5 z-10 p-1 bg-screen rounded border border-gray-700 overflow-auto"
      on:click|stopPropagation={() => (editTrack = undefined)}
    >
      {#if intervals.length === 0}
        <span class:animate-pulse={intervals.length === 0}>Loading...</span>
      {/if}
      {#each intervals as track (track.id)}
        <div class="flex items-center">
          <p class="text-xs text-gray-300 flex-auto">{toDate(track.start)}</p>
          <p class="text-xs text-gray-300 flex-auto">{toTime(track.time)}</p>
          <button
            class="flex-none w-8"
            on:click|stopPropagation={() => showEditTrack(track)}
            ><EditIcon /></button
          >
          <button class="flex-none w-8" on:click={() => deleteTrack(track)}
            ><TrashIcon /></button
          >
          {#if editTrack && editTrack.id === track.id}
            <div
              class="absolute left-20 text-xs z-10 bg-screen rounded-lg border border-gray-600 w-16 opacity-100"
              on:click|stopPropagation
            >
              <TimeTrackInput
                bind:timeTrackInput
                bind:timeTrackText
                on:submit={({ detail }) => updateTrack(track, detail)}
                on:cancel={() => (editTrack = undefined)}
              />
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .copy-hover:hover span {
    opacity: 1;
  }
</style>
