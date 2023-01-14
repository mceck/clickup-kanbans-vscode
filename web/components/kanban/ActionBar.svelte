<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Task } from '../../interfaces/clickup';
  import TimeTrackInput from '../commons/TimeTrackInput.svelte';

  import Icon from '../commons/Icon.svelte';

  export let task: Task;
  export let statuses: string[];

  let timeTrackInput: HTMLInputElement;
  let showTimeTrack = false;

  const dispatch = createEventDispatcher();

  function shiftState(n: number) {
    const idx = statuses.findIndex((s) => task.status.status === s) + n;
    return statuses[idx];
  }

  async function actionNext() {
    const nextStatus = shiftState(1);
    dispatch('next', nextStatus);
  }

  async function actionPrev() {
    const nextStatus = shiftState(-1);
    dispatch('prev', nextStatus);
  }

  function actionTimeTrack() {
    showTimeTrack = true;
    setTimeout(() => timeTrackInput.focus(), 0);
  }

  async function track(time: number) {
    showTimeTrack = false;
    dispatch('track', time);
  }
</script>

<svelte:window on:click={() => (showTimeTrack = false)} />

<div class="relative">
  <div class="grid grid-cols-4 rounded overflow-hidden">
    <button class="flex justify-center items-center" on:click={actionPrev}
      ><Icon class="h-6" name="left" /></button
    >
    <button
      class="flex justify-center items-center"
      on:click|stopPropagation={actionTimeTrack}
      ><Icon class="h-6" name="clock" /></button
    >
    <a href={task.url}
      ><button class="flex justify-center items-center"
        ><Icon class="h-6" name="doc-search" /></button
      ></a
    >
    <button class="flex justify-center items-center" on:click={actionNext}
      ><Icon class="h-6 rotate-180 transform" name="left" /></button
    >
  </div>
  {#if showTimeTrack}
    <div
      class="absolute bottom-full z-10 bg-screen rounded-lg border border-gray-600 w-36 opacity-100"
      on:click|stopPropagation
    >
      <TimeTrackInput
        bind:timeTrackInput
        on:submit={({ detail }) => track(detail)}
        on:cancel={() => (showTimeTrack = false)}
      />
    </div>
  {/if}
</div>

<style>
</style>
