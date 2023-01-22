<script lang="ts">
  import moment from 'moment';
  import { createEventDispatcher } from 'svelte';
  import type { Interval } from '../../../interfaces/clickup';
  import Icon from '../../commons/Icon.svelte';
  import TimeTrackInput from '../../commons/TimeTrackInput.svelte';
  import { toDate, toTime, toTimeInput } from '../../utils/formatters';

  export let intervals: Interval[];
  export let loading: boolean = false;

  let editTrack: Interval = undefined;
  let timeTrackInput: HTMLInputElement;
  let timeTrackText: string = '';

  const dispatch = createEventDispatcher();

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
    timeTrackText = toTimeInput(track.duration);
  }
</script>

<svelte:window on:click={() => (editTrack = undefined)} />

<div
  class="absolute w-4/5 max-h-24 top-7 z-10 p-1 bg-screen rounded border border-gray-700 overflow-auto"
  on:click|stopPropagation={() => (editTrack = undefined)}
>
  {#if loading}
    <span class="animate-pulse">Loading...</span>
  {:else if intervals.length === 0}
    <span>Empty</span>
  {/if}
  {#each intervals as track (track.id)}
    <div class="flex items-center">
      <p class="text-xs text-gray-300 flex-auto">{toDate(track.start)}</p>
      <p class="text-xs text-gray-300 flex-auto">
        {toTime(track.duration)}
      </p>
      <button
        class="flex-none w-8"
        on:click|stopPropagation={() => showEditTrack(track)}
        ><Icon name="edit" /></button
      >
      <button class="flex-none w-8" on:click={() => dispatch('delete', track)}
        ><Icon name="trash" /></button
      >
      {#if editTrack && editTrack.id === track.id}
        <div
          class="absolute left-20 text-xs z-10 bg-screen rounded-lg border border-gray-600 w-16 opacity-100"
          on:click|stopPropagation
        >
          <TimeTrackInput
            bind:timeTrackInput
            bind:timeTrackText
            on:submit={({ detail: time }) => {
              dispatch('update', { track, time });
              editTrack = undefined;
            }}
            on:cancel={() => (editTrack = undefined)}
          />
        </div>
      {/if}
    </div>
  {/each}
</div>
