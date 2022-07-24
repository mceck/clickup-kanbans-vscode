<script lang="ts">
  import moment from "moment";

  import { createEventDispatcher } from "svelte";

  import type { Interval, Task } from "../interfaces/clickup";
  import ClickupService from "../services/clickup-service";
  import ActionBar from "./ActionBar.svelte";
  import AssigneesSelector from "./AssigneesSelector/AssigneesSelector.svelte";
  // @ts-ignore
  import TrashIcon from "../assets/trash.svg";
  // @ts-ignore
  import EditIcon from "../assets/edit.svg";
  import TimeTrackInput from "./TimeTrackInput.svelte";

  export let task: Task;
  export let statusKeys: string[];

  let timeTrackInput: HTMLInputElement;
  let timeTrackText: string = "";
  let showTracking = false;
  let editTrack: Interval;
  let intervals: Interval[] = [];

  const dispatch = createEventDispatcher();
  const service = new ClickupService();

  async function toggleTracks() {
    showTracking = !showTracking;
    if (showTracking && !intervals.length) {
      const res = await service.getTimeTracked(task.id);
      intervals = (res.ok && res.data[0]?.intervals) || [];
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
    const t = moment(parseInt(track.time as any))?.add(-1, "hour");
    timeTrackText = t.format("HH") + "h " + t.format("mm") + "m";
  }

  async function deleteTrack(track) {
    await service.deleteTimeTracked(task.id, track.id);
    intervals = intervals.filter((i) => i.id !== track.id);
    const newTask = {
      ...task,
      time_spent: parseInt(task.time_spent as any) - parseInt(track.time),
    };
    if (intervals.length === 0) {
      showTracking = false;
    }
    dispatch("refresh", newTask);
  }

  function toDate(time) {
    return moment(parseInt(time)).format("DD/MM/YYYY");
  }

  function toTime(time) {
    return moment(parseInt(time)).add(-1, "hour").format("HH:mm");
  }

  async function updateTrack(interval, time: number) {
    editTrack = undefined;
    await service.updateTimeTracked(task.id, interval.id, {
      start: interval.start,
      end: parseInt(interval.start) + time,
      time,
    });
    const newTask = {
      ...task,
      time_spent: (task.time_spent || 0) + time - parseInt(interval.time),
    };
    dispatch("refresh", newTask);
    showTracking = false;
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
        bind:selectedAssignees={task.assignees}
        editable={false}
        maxShown={4}
        small
      />
    </div>

    <p>
      {task.name}
    </p>
    {#if task.time_estimate}
      <small class="text-sm absolute left-2 top-1 text-gray-400">
        est: {(task.time_estimate / 3600000).toFixed(0)}h
      </small>
    {/if}
    {#if task.time_spent}
      <small
        class="text-sm absolute text-green-500 left-20 top-1 cursor-pointer"
        on:click|stopPropagation={toggleTracks}
      >
        tracked: {(task.time_spent / 3600000).toFixed(1)}h
      </small>
    {/if}
    {#if task.description}
      <small
        class="text-sm whitespace-nowrap text-gray-400 overflow-hidden overflow-ellipsis"
        title={task.description}
      >
        {task.description}
      </small>
    {/if}
  </div>
  <div class="w-full px-2 pb-2 rounded shadow">
    <ActionBar
      {task}
      statuses={statusKeys}
      on:refresh={(e) => dispatch("refresh", e.detail)}
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
