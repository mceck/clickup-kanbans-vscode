<script lang="ts">
  import moment from 'moment';
  import { createEventDispatcher, onMount } from 'svelte';
  import type { Interval, Task } from '../../interfaces/clickup';
  import clickupService from '../../services/clickup-service';
  import Icon from '../commons/Icon.svelte';
  import TimeTrackInput from '../commons/TimeTrackInput.svelte';
  import { toHours, toTimeInput } from '../utils/formatters';

  export let tasks: Task[];
  export let trackings: Interval[];

  export let trackedWeek: string;

  let starred: string[] = [];
  let editing: { day: number; taskId: string } | null = null;

  let inputsRef: Record<string, HTMLInputElement> = {};

  const dispatch = createEventDispatcher();

  $: sortedTasks = [...tasks].sort((a, b) => {
    const inA = starred.includes(a.id),
      inB = starred.includes(b.id);
    if (inA !== inB) {
      return inB ? 1 : -1;
    }
    return a.name.localeCompare(b.name);
  });

  onMount(async () => {
    const { data } = await clickupService.getCache('starred');
    starred = data ?? [];
  });

  function tracksForTaskDay(trackings, taskId: string, day: number) {
    return trackings.filter((t) => {
      const d = moment(trackedWeek).add(day, 'days');
      const start = d.startOf('day').valueOf();
      const end = d.endOf('day').valueOf();
      return t.task.id === taskId && t.start >= start && t.start <= end;
    });
  }

  function totalForTaskDay(trackings, taskId: string, day: number) {
    const tracks = tracksForTaskDay(trackings, taskId, day);
    const duration = tracks.reduce((acc, t) => acc + t.duration, 0);
    return duration;
  }

  function totalForDay(trackings, day: number) {
    return trackings
      .filter((t) => {
        const d = moment(trackedWeek).add(day, 'days');
        const start = d.startOf('day').valueOf();
        const end = d.endOf('day').valueOf();
        return t.start >= start && t.start <= end;
      })
      .reduce((acc, t) => acc + t.duration, 0);
  }

  function updateTrack(task: Task, day: number, newTime: number) {
    const time = newTime - totalForTaskDay(trackings, task.id, day);
    const date = moment(trackedWeek).add(day, 'days').startOf('day').valueOf();
    dispatch('addTrack', { task, time, day: date });
    editing = null;
  }

  function changeWeek() {
    dispatch('changeWeek');
  }

  async function star(taskId: string) {
    starred = [...starred, taskId];
    await clickupService.setCache('starred', starred);
  }

  function isEditing(taskId: string, day: number) {
    return editing?.taskId === taskId && editing?.day === day;
  }

  function toggleEdit(taskId: string, day: number) {
    editing = { taskId, day };
    setTimeout(() => inputsRef[`${taskId}_${day}`]?.focus(), 0);
  }
</script>

<svelte:window on:click={() => (editing = null)} />
<div>
  <div class="flex items-center mt-2 mb-4">
    <p>Week:</p>
    <div class="ml-2 w-56">
      <input type="week" bind:value={trackedWeek} on:change={changeWeek} />
    </div>
  </div>

  <div class="flex flex-wrap w-full">
    <div class="flex w-full items-center mb-3 text-lg font-bold">
      <p class="w-1/12"><Icon class="w-6" name="star" /></p>
      <p class="w-6/12 align-baseline">
        Task <span class="font-normal text-sm italic float-right pt-1 mr-8"
          >{moment(trackedWeek).format('DD/MM/yyyy')} - {moment(trackedWeek)
            .add(4, 'days')
            .format('DD/MM/yyyy')}</span
        >
      </p>
      <p class="w-1/12">{moment(trackedWeek).add(0, 'days').format('ddd')}</p>
      <p class="w-1/12">{moment(trackedWeek).add(1, 'days').format('ddd')}</p>
      <p class="w-1/12">{moment(trackedWeek).add(2, 'days').format('ddd')}</p>
      <p class="w-1/12">{moment(trackedWeek).add(3, 'days').format('ddd')}</p>
      <p class="w-1/12">{moment(trackedWeek).add(4, 'days').format('ddd')}</p>
    </div>
    <div class="flex w-full items-center pb-3 border-b-4 border-neutral-800">
      <p class="w-1/12" />
      <p class="w-6/12" />
      <p
        class="w-1/12 {totalForDay(trackings, 0) === 3600000 * 8
          ? 'text-green-500'
          : 'text-red-400'}"
      >
        {toHours(totalForDay(trackings, 0))}
      </p>
      <p
        class="w-1/12 {totalForDay(trackings, 1) === 3600000 * 8
          ? 'text-green-500'
          : 'text-red-400'}"
      >
        {toHours(totalForDay(trackings, 1))}
      </p>
      <p
        class="w-1/12 {totalForDay(trackings, 2) === 3600000 * 8
          ? 'text-green-500'
          : 'text-red-400'}"
      >
        {toHours(totalForDay(trackings, 2))}
      </p>
      <p
        class="w-1/12 {totalForDay(trackings, 3) === 3600000 * 8
          ? 'text-green-500'
          : 'text-red-400'}"
      >
        {toHours(totalForDay(trackings, 3))}
      </p>
      <p
        class="w-1/12 {totalForDay(trackings, 4) === 3600000 * 8
          ? 'text-green-500'
          : 'text-red-400'}"
      >
        {toHours(totalForDay(trackings, 4))}
      </p>
    </div>
    {#each sortedTasks as task (task.id)}
      <div class="flex w-full items-center py-4 border-b border-neutral-800">
        <p class="w-1/12" on:click={() => star(task.id)}>
          <Icon
            name={starred.includes(task.id) ? 'star' : 'star-empty'}
            class="w-6"
          />
        </p>
        <p class="w-6/12">{task.name}</p>
        <p class="w-1/12 pr-4" on:click|stopPropagation>
          {#if editing && isEditing(task.id, 0)}
            <TimeTrackInput
              bind:timeTrackInput={inputsRef[`${task.id}_0`]}
              class="nopady"
              timeTrackText={toTimeInput(
                totalForTaskDay(trackings, task.id, 0)
              )}
              on:submit={({ detail: time }) => updateTrack(task, 0, time)}
            />
          {:else}
            <span
              on:click|stopPropagation={() => toggleEdit(task.id, 0)}
              class:text-neutral-600={totalForTaskDay(trackings, task.id, 0) ===
                0}
            >
              {toHours(totalForTaskDay(trackings, task.id, 0))}
            </span>
          {/if}
        </p>
        <p class="w-1/12 pr-4" on:click|stopPropagation>
          {#if editing && isEditing(task.id, 1)}
            <TimeTrackInput
              bind:timeTrackInput={inputsRef[`${task.id}_1`]}
              class="nopady"
              timeTrackText={toTimeInput(
                totalForTaskDay(trackings, task.id, 1)
              )}
              on:submit={({ detail: time }) => updateTrack(task, 1, time)}
            />
          {:else}
            <span
              on:click|stopPropagation={() => toggleEdit(task.id, 1)}
              class:text-neutral-600={totalForTaskDay(trackings, task.id, 1) ===
                0}
            >
              {toHours(totalForTaskDay(trackings, task.id, 1))}
            </span>
          {/if}
        </p>
        <p class="w-1/12 pr-4" on:click|stopPropagation>
          {#if editing && isEditing(task.id, 2)}
            <TimeTrackInput
              bind:timeTrackInput={inputsRef[`${task.id}_2`]}
              class="nopady"
              timeTrackText={toTimeInput(
                totalForTaskDay(trackings, task.id, 2)
              )}
              on:submit={({ detail: time }) => updateTrack(task, 2, time)}
            />
          {:else}
            <span
              on:click|stopPropagation={() => toggleEdit(task.id, 2)}
              class:text-neutral-600={totalForTaskDay(trackings, task.id, 2) ===
                0}
            >
              {toHours(totalForTaskDay(trackings, task.id, 2))}
            </span>
          {/if}
        </p>
        <p class="w-1/12 pr-4" on:click|stopPropagation>
          {#if editing && isEditing(task.id, 3)}
            <TimeTrackInput
              bind:timeTrackInput={inputsRef[`${task.id}_3`]}
              class="nopady"
              timeTrackText={toTimeInput(
                totalForTaskDay(trackings, task.id, 3)
              )}
              on:submit={({ detail: time }) => updateTrack(task, 3, time)}
            />
          {:else}
            <span
              on:click|stopPropagation={() => toggleEdit(task.id, 3)}
              class:text-neutral-600={totalForTaskDay(trackings, task.id, 3) ===
                0}
            >
              {toHours(totalForTaskDay(trackings, task.id, 3))}
            </span>
          {/if}
        </p>
        <p class="w-1/12 pr-4" on:click|stopPropagation>
          {#if editing && isEditing(task.id, 4)}
            <TimeTrackInput
              bind:timeTrackInput={inputsRef[`${task.id}_4`]}
              class="nopady"
              timeTrackText={toTimeInput(
                totalForTaskDay(trackings, task.id, 4)
              )}
              on:submit={({ detail: time }) => updateTrack(task, 4, time)}
            />
          {:else}
            <span
              on:click|stopPropagation={() => toggleEdit(task.id, 4)}
              class:text-neutral-600={totalForTaskDay(trackings, task.id, 4) ===
                0}
            >
              {toHours(totalForTaskDay(trackings, task.id, 4))}
            </span>
          {/if}
        </p>
      </div>
    {/each}
  </div>
</div>
