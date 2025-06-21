<script lang="ts">
  import type { Interval } from '../../interfaces/clickup';
  import Icon from './Icon.svelte';
  import TimeTrackInput from './TimeTrackInput.svelte';
  import { toDate, toTime, toTimeInput } from '../utils/formatters';
  import { outsideClickable } from '../utils/clickOutside';
  import { dateFormat, t } from '../../store/i18n';

  interface Props {
    intervals: Interval[];
    loading?: boolean;
    showTask?: boolean;
    class?: string;
    onDelete?: (track: Interval) => void;
    onUpdate?: (event: { track: Interval; time: number }) => void;
  }

  let { intervals, loading, showTask, onDelete, onUpdate, ...rest }: Props =
    $props();

  let editTrack: Interval | undefined = $state(undefined);
  let timeTrackInput: HTMLInputElement = $state()!;
  let timeTrackText: string = $state('');

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

<div
  class="absolute w-4/5 max-h-24 top-7 z-10 p-1 bg-screen rounded border border-gray-700 overflow-auto {rest.class}"
  onclick={(e: Event) => e.stopPropagation()}
>
  {#if loading}
    <span class="animate-pulse">{$t('global.loading')}</span>
  {:else if intervals.length === 0}
    <span>{$t('global.empty')}</span>
  {/if}
  {#each intervals as track (track.id)}
    <div
      class="flex items-center"
      use:outsideClickable
      onclickOutside={() => (editTrack = undefined)}
    >
      <p class="text-xs text-gray-300 pr-2 {showTask ? 'w-20' : 'flex-auto'}">
        {toDate(track.start, $dateFormat)}
      </p>
      <p class="text-xs text-gray-300 px-2 {showTask ? 'w-12' : 'flex-auto'}">
        {toTime(track.duration)}
      </p>
      {#if showTask}
        <a
          class="text-xs text-gray-300 flex-1 cursor-pointer px-2"
          href={track.task.url}>{track.task.name}</a
        >
      {/if}
      <button class="flex-none w-8" onclick={() => showEditTrack(track)}
        ><Icon name="edit" /></button
      >
      <button class="flex-none w-8" onclick={() => onDelete?.(track)}
        ><Icon name="trash" /></button
      >
      {#if editTrack && editTrack.id === track.id}
        <div
          class="absolute left-20 text-xs z-10 bg-screen rounded-lg border border-gray-600 w-16 opacity-100"
        >
          <TimeTrackInput
            bind:timeTrackInput
            bind:timeTrackText
            onSubmit={(time) => {
              onUpdate?.({ track, time });
              editTrack = undefined;
            }}
            onCancel={() => (editTrack = undefined)}
          />
        </div>
      {/if}
    </div>
  {/each}
</div>
