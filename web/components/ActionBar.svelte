<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import ClickupService from "../services/clickup-service";
  import type { Task } from "../interfaces/clickup";
  // @ts-ignore
  import ClockIcon from "../assets/clock.svg";
  // @ts-ignore
  import LeftIcon from "../assets/left.svg";
  // @ts-ignore
  import DocSearchIcon from "../assets/doc-search.svg";

  export let task: Task;
  export let statuses: string[];

  let timeTrackInput: HTMLInputElement;
  let showTimeTrack = false;
  let timeTrackText = "";

  const dispatch = createEventDispatcher();

  async function actionNext() {
    const idx = statuses.findIndex((s) => task.status.status === s) + 1;
    if (idx < 1 || idx >= statuses.length) {
      return;
    }
    const nextStatus = statuses[idx];
    const result = await new ClickupService().updateTask(task.id, {
      status: nextStatus,
    });
    dispatch("refresh", result.data);
  }

  async function actionPrev() {
    const idx = statuses.findIndex((s) => task.status.status === s) - 1;
    if (idx < 0 || idx >= statuses.length) {
      return;
    }
    const nextStatus = statuses[idx];
    const result = await new ClickupService().updateTask(task.id, {
      status: nextStatus,
    });
    dispatch("refresh", result.data);
  }

  function actionTimeTrack() {
    showTimeTrack = true;
    timeTrackText = "";
    setTimeout(() => timeTrackInput.focus(), 0);
  }
</script>

<svelte:window on:click={() => (showTimeTrack = false)} />

<div class="relative">
  <div class="grid grid-cols-4 rounded overflow-hidden">
    <button class="flex justify-center items-center" on:click={actionPrev}
      ><LeftIcon class="h-6" /></button
    >
    <button
      class="flex justify-center items-center"
      on:click|stopPropagation={actionTimeTrack}
      ><ClockIcon class="h-6" /></button
    >
    <a href={task.url}
      ><button class="flex justify-center items-center"
        ><DocSearchIcon class="h-6" /></button
      ></a
    >
    <button class="flex justify-center items-center" on:click={actionNext}
      ><LeftIcon class="h-6 rotate-180 transform" /></button
    >
  </div>
  {#if showTimeTrack}
    <div
      class="absolute bottom-full z-10 bg-screen rounded-lg border border-gray-600 w-36 opacity-100"
      on:click|stopPropagation
    >
      <input bind:value={timeTrackText} bind:this={timeTrackInput} />
    </div>
  {/if}
</div>

<style>
</style>
