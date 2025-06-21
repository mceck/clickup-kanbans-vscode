<script lang="ts">
  // import { createEventDispatcher } from 'svelte'; // Removed

  import type { Interval, Task, User } from '../../../interfaces/clickup';
  import clickupService from '../../../services/clickup-service';
  import ActionBar from './ActionBar.svelte';
  import AssigneesSelector from '../../shared/assignees-selector/AssigneesSelector.svelte';
  import TimeTrackInput from '../../shared/TimeTrackInput.svelte';
  import Icon from '../../shared/Icon.svelte';
  import TaskDetail from './TaskDetail.svelte';
  import EditTracking from '../../shared/EditTracking.svelte';
  import { toHours } from '../../utils/formatters';
  import { tagList } from '../../../store/tags';
  import { outsideClickable } from '../../utils/clickOutside';
  import { t } from '../../../store/i18n';

  interface Props {
    task: Task;
    statusKeys: string[];
    onAddTrack?: (detail: { task: Task; time: number }) => void;
    onDeleteTrack?: (track: Interval) => void;
    onChangeTrack?: (detail: { track: Interval; time: number }) => void;
    onUpdateTask?: (detail: {
      id: string;
      assignees?: { add?: string[]; rem?: string[] };
      status?: string;
      refresh?: boolean;
    }) => void;
    onAddTag?: (detail: { taskId: string; tag: string }) => void;
    onDeleteTag?: (detail: { taskId: string; tag: string }) => void;
  }

  let {
    task,
    statusKeys,
    onAddTrack: propsOnAddTrack,
    onDeleteTrack: propsOnDeleteTrack,
    onChangeTrack: propsOnChangeTrack,
    onUpdateTask: propsOnUpdateTask,
    onAddTag: propsOnAddTag,
    onDeleteTag: propsOnDeleteTag,
  }: Props = $props();

  let addTimeTrackInput: HTMLInputElement | undefined = $state();
  let showTracking = $state(false);
  let intervals: Interval[] = $state([]);
  let expanded = $state(false);
  let loadingIntervals = $state(false);
  let showAddTrack = $state(false);
  let showAddTag = $state(false);

  let searchTag = $state('');
  let loadingTags = $state(false);

  let spaceTags = $derived($tagList[task.space!.id] ?? []);

  let filteredTags = $derived(
    spaceTags.filter(
      (t) =>
        !task.tags.map((e) => e.name).includes(t.name) &&
        t.name.toLowerCase().includes(searchTag.toLowerCase())
    )
  );

  // const dispatch = createEventDispatcher(); // Removed

  async function trackTaskTime(task: Task, time: number) {
    propsOnAddTrack?.({ task, time });
    showAddTrack = false;
    intervals = [];
  }

  async function deleteTrack(track: Interval) {
    propsOnDeleteTrack?.(track);
    showTracking = false;
    intervals = [];
  }

  async function updateTrack(track: Interval, time: number) {
    propsOnChangeTrack?.({ track, time });
    showTracking = false;
    intervals = [];
  }

  async function addAssignee(assignee: User) {
    propsOnUpdateTask?.({
      id: task.id,
      assignees: { add: [String(assignee.id)] },
    });
    // close picker
    document.body.click();
  }

  async function removeAssignee(assignee: User) {
    propsOnUpdateTask?.({
      id: task.id,
      assignees: { rem: [String(assignee.id)] },
    });
  }

  async function setTaskState(task: Task, state: string) {
    propsOnUpdateTask?.({
      id: task.id,
      status: state,
      refresh: true,
    });
  }

  function startAddTrack() {
    showAddTrack = true;
    showTracking = false;

    setTimeout(() => addTimeTrackInput?.focus(), 0);
  }

  async function toggleTracks() {
    showTracking = !showTracking;
    if (showTracking && !intervals.length) {
      loadingIntervals = true;
      const res = await clickupService.findTimeTrack({ task_id: task.id });
      if (res.ok) {
        intervals = (res.ok && res.data) || [];
      }
      loadingIntervals = false;
    }
  }

  function gitCheckout(task: Task) {
    if (!task.custom_id) {
      return;
    }
    clickupService.gitCheckout(task.custom_id);
  }

  function copyCustomId() {
    if (!task.custom_id) {
      return;
    }
    navigator.clipboard
      .writeText(task.custom_id)
      .then(() => clickupService.showStatusMessage('Copied'));
  }

  function copyTaskLink() {
    navigator.clipboard
      .writeText(task.url)
      .then(() => clickupService.showStatusMessage('Copied'));
  }

  async function toggleAddTag() {
    showAddTag = !showAddTag;
    if (showAddTag && !spaceTags.length) {
      loadingTags = true;
      const { data, ok } = await clickupService.getSpaceTags(task.space!.id);
      loadingTags = false;
      if (ok) {
        tagList.set({
          ...$tagList,
          [task.space!.id]: data,
        });
      }
    }
  }

  function addTag(tag: string) {
    propsOnAddTag?.({
      taskId: task.id,
      tag,
    });
  }

  function deleteTag(tag: string) {
    propsOnDeleteTag?.({
      taskId: task.id,
      tag,
    });
  }
</script>

<div
  class="px-2 pt-6 border border-gray-600 hover:border-gray-500 rounded-lg my-1 relative"
>
  <div
    class="flex flex-col overflow-auto w-auto {expanded ? 'min-h-24' : 'h-24'}"
  >
    <div
      class="absolute left-0 top-0 px-2 pt-1 w-full flex items-center justify-between"
      use:outsideClickable
      onclickOutside={() => {
        showTracking = false;
      }}
    >
      <div class="w-1/12 flex" title={$t('global.time-estimated')}>
        {#if task.time_estimate}
          <small
            class="text-xs text-gray-400"
            title={$t('global.time-estimated')}
          >
            {toHours(task.time_estimate, 0)}
          </small>
        {/if}
      </div>
      <div class="w-2/12 ml-1 flex" title={$t('global.time-tracked')}>
        {#if task.time_spent}
          <small
            class="text-xs text-green-500 cursor-pointer"
            title={$t('global.time-tracked')}
            onclick={toggleTracks}
          >
            {toHours(task.time_spent)}
          </small>
        {/if}
      </div>
      <div
        class="max-w-1/12 cursor-pointer"
        title={$t('global.add-time-track')}
        use:outsideClickable
        onclickOutside={() => {
          showAddTrack = false;
        }}
        onclick={startAddTrack}
      >
        <Icon
          name="plus"
          class="w-3 text-green-400 hover:text-green-300 stroke-current"
        />
        {#if showAddTrack}
          <div
            class="absolute top-full z-10 bg-screen rounded-lg border border-gray-600 w-36 opacity-100"
          >
            <TimeTrackInput
              bind:timeTrackInput={addTimeTrackInput}
              onSubmit={(millis) => trackTaskTime(task, millis)}
              onCancel={() => (showAddTrack = false)}
            />
          </div>
        {/if}
      </div>
      <div class="w-3/12 ml-1">
        {#if task.custom_id}
          <div class="-ml-1 flex items-center copy-hover">
            <span
              class="opacity-0 transition-opacity cursor-pointer"
              onclick={copyCustomId}
            >
              <Icon name="copy" class="w-3 text-yellow-100 stroke-current" />
            </span>
            <small
              class="text-xs text-yellow-600 cursor-pointer whitespace-nowrap"
              onclick={copyCustomId}
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
          onAdd={(user) => addAssignee(user)}
          onRemove={(user) => removeAssignee(user)}
          maxShown={4}
          small
          manual
        />
      </div>
      {#if showTracking}
        <EditTracking
          {intervals}
          loading={loadingIntervals}
          onUpdate={(event) => updateTrack(event.track, event.time)}
          onDelete={(track) => deleteTrack(track)}
        />
      {/if}
    </div>
    <div class="h-full overflow-hidden group">
      <div class="text-xs text-neutral-500">{task.list?.name}</div>
      <div
        class="flex mt-1 relative items-center"
        use:outsideClickable
        onclickOutside={() => (showAddTag = false)}
      >
        <div class="flex overflow-x-auto overflow-invisible">
          {#each task.tags as tag (tag.name)}
            <span
              class="w-12 px-1 rounded text-xs text-white shadow text-ellipsis whitespace-nowrap overflow-hidden cursor-pointer"
              style={`background-color: ${tag.tag_bg || '#1c1c1c'};`}
              title={tag.name}
              ondblclick={() => deleteTag(tag.name)}>{tag.name}</span
            >
          {/each}
        </div>
        {#if !task.tags.length}
          <span class="rounded text-xs text-gray-500"
            >{$t('global.tags').toLowerCase()}:</span
          >
        {/if}
        <span class="w-3 ml-1 cursor-pointer flex-none" onclick={toggleAddTag}>
          <Icon
            name="plus"
            class="w-3 text-highlight hover:text-blue-300 stroke-current"
            title={$t('global.add-tag')}
          />
        </span>
        {#if showAddTag}
          <div
            class="absolute top-full z-1000 bg-screen rounded-lg border border-gray-600 w-48 opacity-100"
          >
            <div class="overflow-x-auto overflow-invisible flex mt-2">
              {#if loadingTags}
                <Icon name="cog" class="w-4 ml-2 animate-spin" />
              {/if}
              {#each filteredTags as tag}
                <div
                  class="cursor-pointer w-12 flex-none rounded text-xs text-white shadow text-ellipsis whitespace-nowrap overflow-hidden mx-2 px-1"
                  onclick={() => addTag(tag.name)}
                  style={`background-color: ${tag.tag_bg || '#1c1c1c'};`}
                >
                  {tag.name}
                </div>
              {/each}
            </div>
            <div class="flex items-center justify-between px-2 py-2">
              <input
                type="text"
                class="w-full h-4 bg-transparent border-b border-gray-500 text-white text-xs"
                placeholder={$t('global.search-tag')}
                bind:value={searchTag}
              />
            </div>
          </div>
        {/if}
      </div>
      <p class="w-full">
        <span
          class="float-right cursor-pointer p-1 opacity-0 group-hover:opacity-100"
          title={$t('global.copy-task-link')}
          onclick={copyTaskLink}><Icon name="link" class="w-3" /></span
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
      onNext={(nextStatus) => setTaskState(task, nextStatus)}
      onPrev={(nextStatus) => setTaskState(task, nextStatus)}
      onCheckout={() => gitCheckout(task)}
      onExpand={(isExpanded) => (expanded = isExpanded)}
    />
  </div>
</div>

<style>
  .copy-hover:hover span {
    opacity: 1;
  }

  .overflow-invisible::-webkit-scrollbar {
    display: none;
  }
</style>
