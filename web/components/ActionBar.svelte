<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import ClickupService from '../services/clickup-service';
  import type { Task } from '../interfaces/clickup';
  // @ts-ignore
  import ClockIcon from '../assets/clock.svg';
  // @ts-ignore
  import LeftIcon from '../assets/left.svg';
  // @ts-ignore
  import DocSearchIcon from '../assets/doc-search.svg';
  import TimeTrackInput from './TimeTrackInput.svelte';

  import moment from 'moment';

  export let task: Task;
  export let statuses: string[];

  let timeTrackInput: HTMLInputElement;
  let showTimeTrack = false;

  const service = new ClickupService();

  const dispatch = createEventDispatcher();

  async function actionNext() {
    const idx = statuses.findIndex((s) => task.status.status === s) + 1;
    if (idx < 1 || idx >= statuses.length) {
      return;
    }
    const nextStatus = statuses[idx];
    const result = await service.updateTask(task.id, {
      status: nextStatus,
    });
    if (result.ok) {
      service.showStatusMessage('Task updated');
      dispatch('refresh', result.data);
    }
  }

  async function actionPrev() {
    const idx = statuses.findIndex((s) => task.status.status === s) - 1;
    if (idx < 0 || idx >= statuses.length) {
      return;
    }
    const nextStatus = statuses[idx];
    const result = await service.updateTask(task.id, {
      status: nextStatus,
    });
    if (result.ok) {
      service.showStatusMessage('Task updated');
      dispatch('refresh', result.data);
    }
  }

  function actionTimeTrack() {
    showTimeTrack = true;
    setTimeout(() => timeTrackInput.focus(), 0);
  }

  async function track(time: number) {
    showTimeTrack = false;
    const res = await service.getTimeTracked(task.id);
    const interval =
      res.ok &&
      res.data[0]?.intervals?.find(
        (i) => parseInt(i.start) >= moment().startOf('day').valueOf()
      );

    if (interval) {
      const updatedTime = parseInt(interval.time) + time;
      const resp = await service.updateTimeTracked(task.id, interval.id, {
        start: interval.start,
        end: parseInt(interval.start) + updatedTime,
        time: updatedTime,
      });
      if (resp.ok) {
        service.showStatusMessage('Time tracked');
      } else {
        return;
      }
    } else {
      const resp = await service.createTimeTrack(task.id, {
        start: moment().valueOf(),
        time,
      });
      if (resp.ok) {
        service.showStatusMessage('Time tracked');
      } else {
        return;
      }
    }
    task = {
      ...task,
      time_spent: (task.time_spent || 0) + time,
    };
    dispatch('refresh', task);
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
