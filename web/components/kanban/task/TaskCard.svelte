<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import type { Interval, Task, User } from '../../../interfaces/clickup';
  import clickupService from '../../../services/clickup-service';
  import ActionBar from './ActionBar.svelte';
  import AssigneesSelector from '../../commons/assignees-selector/AssigneesSelector.svelte';
  import TimeTrackInput from '../../commons/TimeTrackInput.svelte';
  import Icon from '../../commons/Icon.svelte';
  import TaskDetail from './TaskDetail.svelte';
  import EditTracking from '../../commons/EditTracking.svelte';
  import { toHours } from '../../utils/formatters';

  export let task: Task;
  export let statusKeys: string[];

  let addTimeTrackInput: HTMLInputElement;
  let showTracking = false;
  let intervals: Interval[] = [];
  let expanded = false;
  let loadingIntervals = false;
  let showAddTrack = false;

  const dispatch = createEventDispatcher();

  async function trackTaskTime(task: Task, time: number) {
    dispatch('addTrack', { task, time });
    showAddTrack = false;
    intervals = [];
  }

  async function deleteTrack(track: Interval) {
    dispatch('deleteTrack', track);
    showTracking = false;
    intervals = [];
  }

  async function updateTrack(track: Interval, time: number) {
    dispatch('changeTrack', { track, time });
    showTracking = false;
    intervals = [];
  }

  async function addAssignee(assignee: User) {
    dispatch('updateTask', {
      id: task.id,
      assignees: { add: [assignee.id] },
    });
    // close picker
    document.body.click();
  }

  async function removeAssignee(assignee: User) {
    dispatch('updateTask', {
      id: task.id,
      assignees: { rem: [assignee.id] },
    });
  }

  async function setTaskState(task: Task, state: string) {
    dispatch('updateTask', {
      id: task.id,
      status: state,
      refresh: true,
    });
  }

  function startAddTrack() {
    showAddTrack = true;
    showTracking = false;

    setTimeout(() => addTimeTrackInput.focus(), 0);
  }

  async function toggleTracks() {
    showTracking = !showTracking;
    if (showTracking && !intervals.length) {
      showAddTrack = false;
      loadingIntervals = true;
      const res = await clickupService.findTimeTrack({ task_id: task.id });
      if (res.ok) {
        intervals = (res.ok && res.data) || [];
      }
      loadingIntervals = false;
    }
  }

  function gitCheckout(task: Task) {
    clickupService.gitCheckout(task.custom_id);
  }

  function copyCustomId() {
    navigator.clipboard
      .writeText(task.custom_id)
      .then(() => clickupService.showStatusMessage('Copied'));
  }

  function copyTaskLink() {
    navigator.clipboard
      .writeText(task.url)
      .then(() => clickupService.showStatusMessage('Copied'));
  }
</script>

<svelte:window
  on:click={() => {
    showTracking = false;
    showAddTrack = false;
  }}
/>
<div
  class="px-2 pt-6 border border-gray-600 hover:border-gray-500 rounded-lg my-1 relative"
>
  <div
    class="flex flex-col overflow-auto w-auto {expanded ? 'min-h-24' : 'h-24'}"
  >
    <div
      class="absolute left-0 top-0 px-2 pt-1 w-full flex items-center justify-between"
    >
      <div class="w-1/12 flex" title="Time estimated">
        {#if task.time_estimate}
          <small class="text-xs text-gray-400" title="Time estimated">
            {toHours(task.time_estimate, 0)}
          </small>
        {/if}
      </div>
      <div class="w-2/12 ml-1 flex" title="Time tracked">
        {#if task.time_spent}
          <small
            class="text-xs text-green-500 cursor-pointer"
            title="Time tracked"
            on:click|stopPropagation={toggleTracks}
          >
            {toHours(task.time_spent)}
          </small>
        {/if}
      </div>
      <div
        class="max-w-1/12 cursor-pointer"
        on:click|stopPropagation={startAddTrack}
        title="Add time track"
      >
        <Icon
          name="plus"
          class="w-3 text-green-400 hover:text-green-300 stroke-current"
        />
        {#if showAddTrack}
          <div
            class="absolute top-full z-10 bg-screen rounded-lg border border-gray-600 w-36 opacity-100"
            on:click|stopPropagation
          >
            <TimeTrackInput
              bind:timeTrackInput={addTimeTrackInput}
              on:submit={({ detail }) => trackTaskTime(task, detail)}
              on:cancel={() => (showAddTrack = false)}
            />
          </div>
        {/if}
      </div>
      <div class="w-3/12 ml-1">
        {#if task.custom_id}
          <div class="-ml-1 flex items-center copy-hover">
            <span
              class="opacity-0 transition-opacity cursor-pointer"
              on:click|stopPropagation={copyCustomId}
            >
              <Icon name="copy" class="w-3 text-yellow-100 stroke-current" />
            </span>
            <small
              class="text-xs  text-yellow-600 cursor-pointer whitespace-nowrap"
              on:click|stopPropagation={copyCustomId}
            >
              {task.custom_id}
            </small>
          </div>
        {/if}
      </div>
      <div class="w-4/12 flex justify-end">
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
    </div>
    <div class="h-full overflow-hidden group">
      <div class="text-xs text-neutral-500">{task.list.name}</div>
      <div class="flex mt-1">
        {#each task.tags as tag (tag.name)}
          <span
            class="w-12 px-1 rounded text-xs text-white shadow overflow-ellipsis whitespace-nowrap overflow-hidden"
            style={`background-color: ${tag.tag_bg || '#1c1c1c'};`}
            title={tag.name}>{tag.name}</span
          >
        {/each}
      </div>
      <p class="w-full">
        <span
          class="float-right cursor-pointer p-1 opacity-0 group-hover:opacity-100"
          on:click={copyTaskLink}><Icon name="link" class="w-3" /></span
        >
        {task.name}
      </p>
      {#if expanded}
        <TaskDetail {task} />
      {/if}
    </div>
  </div>
  <div class="w-full px-2 pb-2 rounded shadow">
    <ActionBar
      {task}
      statuses={statusKeys}
      {expanded}
      on:next={(e) => setTaskState(task, e.detail)}
      on:prev={(e) => setTaskState(task, e.detail)}
      on:checkout={(e) => gitCheckout(task)}
      on:expand={(e) => (expanded = !!e.detail)}
    />
  </div>
  {#if showTracking}
    <EditTracking
      {intervals}
      loading={loadingIntervals}
      on:update={({ detail }) => updateTrack(detail.track, detail.time)}
      on:delete={({ detail }) => deleteTrack(detail)}
    />
  {/if}
</div>

<style>
  .copy-hover:hover span {
    opacity: 1;
  }

  .min-h-20 {
    min-height: theme('spacing.20');
  }
</style>
