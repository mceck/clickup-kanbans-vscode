<script lang="ts">
  import TaskRow from './TaskRow.svelte';
  import type { Task, User } from '../../../interfaces/clickup';
  import clickupService from '../../../services/clickup-service';
  import AssigneesSelector from '../../shared/assignees-selector/AssigneesSelector.svelte';
  import Icon from '../../shared/Icon.svelte';
  import { tagList } from '../../../store/tags';
  import { outsideClickable } from '../../utils/clickOutside';
  import { t } from '../../../store/i18n';

  interface Props {
    task: Task;
    isSubtask?: boolean;
    onUpdateTask?: (detail: {
      id: string;
      assignees?: { add?: string[]; rem?: string[] };
      status?: string;
      refresh?: boolean;
    }) => void;
    onAddTag?: (detail: { taskId: string; tag: string }) => void;
    onDeleteTag?: (detail: { taskId: string; tag: string }) => void;
    onSelect?: (task: Task) => void;
  }

  let {
    task,
    isSubtask = false,
    onUpdateTask,
    onAddTag,
    onDeleteTag,
    onSelect,
  }: Props = $props();

  let expanded = $state(false);
  let showAddTag = $state(false);

  let searchTag = $state('');
  let loadingTags = $state(false);

  let spaceTags = $derived($tagList[task.space!.id] ?? []);

  let filteredTags = $derived(
    spaceTags.filter(
      (t) =>
        !task.tags?.map((e) => e.name).includes(t.name) &&
        t.name.toLowerCase().includes(searchTag.toLowerCase())
    )
  );

  async function addAssignee(assignee: User) {
    onUpdateTask?.({
      id: task.id,
      assignees: { add: [String(assignee.id)] },
    });
    // close picker
    document.body.click();
  }

  async function removeAssignee(assignee: User) {
    onUpdateTask?.({
      id: task.id,
      assignees: { rem: [String(assignee.id)] },
    });
  }

  // async function setTaskState(task: Task, state: string) {
  //   onUpdateTask?.({
  //     id: task.id,
  //     status: state,
  //     refresh: true,
  //   });
  // }

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
    onAddTag?.({
      taskId: task.id,
      tag,
    });
  }

  function deleteTag(tag: string) {
    onDeleteTag?.({
      taskId: task.id,
      tag,
    });
  }
</script>

<div class={isSubtask ? '' : 'border-b border-gray-700'}>
  <div class="px-2 pt-1 flex gap-2 relative w-full">
    {#if task.subtasks?.length}
      <div
        class="w-8 flex-none flex items-center justify-center cursor-pointer"
        onclick={() => (expanded = !expanded)}
      >
        <Icon
          name="chevron"
          class={`w-4  transform ${expanded ? 'rotate-180' : ''}`}
        />
      </div>
    {:else}
      <div class="w-8 flex-none"></div>
    {/if}
    <div class="flex-1 overflow-hidden">
      <div class="text-xs text-neutral-500 flex items-center gap-4">
        {task.list?.name}
        {#if task.custom_id}
          <div class="flex items-center group">
            <span
              class="opacity-0 transition-opacity cursor-pointer group-hover:opacity-100"
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
      <p
        class="text-ellipsis whitespace-nowrap overflow-hidden group cursor-pointer hover:text-gray-200"
        onclick={() => onSelect?.(task)}
      >
        <span
          class="float-right cursor-pointer p-1 opacity-0 group-hover:opacity-100"
          title={$t('global.copy-task-link')}
          onclick={(e) => {
            e.stopPropagation();
            copyTaskLink();
          }}><Icon name="link" class="w-3" /></span
        >
        {task.name}
      </p>
    </div>
    <div class="max-w-20 flex-none flex items-center justify-end">
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
    <div
      class="w-20 flex-none flex relative items-center"
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
      {#if !task.tags?.length}
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
          class="absolute right-2 top-full z-1000 bg-screen rounded-lg border border-gray-600 w-48 opacity-100"
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
              autofocus
              class="w-full h-4 bg-transparent border-b border-gray-500 text-white text-xs"
              placeholder={$t('global.search-tag')}
              bind:value={searchTag}
            />
          </div>
        </div>
      {/if}
    </div>
  </div>
  {#if expanded}
    {#each task.subtasks ?? [] as subtask (subtask.id)}
      <div class="pl-8">
        <TaskRow
          isSubtask
          task={subtask}
          {onSelect}
          {onUpdateTask}
          {onAddTag}
          {onDeleteTag}
        />
      </div>
    {/each}
  {/if}
</div>
