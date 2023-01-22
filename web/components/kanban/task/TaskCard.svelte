<script lang="ts">
  import moment from 'moment';

  import { createEventDispatcher } from 'svelte';

  import type { Interval, Task, User } from '../../../interfaces/clickup';
  import clickupService from '../../../services/clickup-service';
  import ActionBar from './ActionBar.svelte';
  import AssigneesSelector from '../../commons/assignees-selector/AssigneesSelector.svelte';
  import TimeTrackInput from '../../commons/TimeTrackInput.svelte';
  import Icon from '../../commons/Icon.svelte';
  import TaskDetail from './TaskDetail.svelte';
  import EditTracking from './EditTracking.svelte';
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

  async function deleteTrack(track) {
    const result = await clickupService.deleteTimeTracked(task.id, track.id);
    if (result.ok) {
      intervals = intervals.filter((i) => i.id !== track.id);
      const newTask = {
        ...task,
        time_spent: +task.time_spent - +track.duration,
      };
      if (intervals.length === 0) {
        showTracking = false;
      }
      dispatch('refresh', newTask);
      clickupService.showToast('info', 'Tracking deleted');
    }
  }

  async function updateTrack(interval, time: number) {
    const result = await clickupService.updateTimeTracked(
      task.id,
      interval.id,
      {
        start: interval.start,
        end: +interval.start + time,
        time,
      }
    );
    if (result.ok) {
      const newTask = {
        ...task,
        time_spent: (task.time_spent || 0) + time - parseInt(interval.duration),
      };
      dispatch('refresh', newTask);
      intervals = intervals.map((i) =>
        i.id === interval.id ? { ...i, duration: time } : i
      );
      showTracking = false;
      clickupService.showStatusMessage('Time tracked');
    }
  }

  function copyCustomId() {
    navigator.clipboard
      .writeText(task.custom_id)
      .then(() => clickupService.showStatusMessage('Copied'));
  }

  async function addAssignee(assignee: User) {
    const oldAssignees = [...task.assignees];
    task.assignees = [...task.assignees, assignee];
    try {
      const res = await clickupService.updateTask(task.id, {
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
      const res = await clickupService.updateTask(task.id, {
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

  async function setTaskState(task: Task, state: string) {
    const result = await clickupService.updateTask(task.id, {
      status: state,
    });
    if (result.ok) {
      clickupService.showStatusMessage('Task updated');
      dispatch('refresh', result.data);
    }
  }

  function startAddTrack() {
    showAddTrack = true;
    showTracking = false;

    setTimeout(() => addTimeTrackInput.focus(), 0);
  }

  async function trackTaskTime(task: Task, time: number) {
    showAddTrack = false;
    const res = await clickupService.getTimeTracked(task.id);
    const interval =
      res.ok &&
      res.data?.find(
        (i) => parseInt(i.start) >= moment().startOf('day').valueOf()
      );

    if (interval) {
      const updatedTime = parseInt(interval.duration) + time;
      const resp = await clickupService.updateTimeTracked(
        task.id,
        interval.id,
        {
          start: interval.start,
          end: parseInt(interval.start) + updatedTime,
          time: updatedTime,
        }
      );
      if (resp.ok) {
        clickupService.showStatusMessage('Time tracked');
      } else {
        return;
      }
    } else {
      const resp = await clickupService.createTimeTrack(task.id, {
        start: moment().startOf('day').valueOf(),
        time,
      });
      if (resp.ok) {
        clickupService.showStatusMessage('Time tracked');
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

  function gitCheckout(task: Task) {
    clickupService.gitCheckout(task.custom_id);
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
    class="flex flex-col overflow-auto w-auto {expanded ? 'min-h-20' : 'h-20'}"
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
    <div class="h-full overflow-hidden">
      <div class="flex mt-1">
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
