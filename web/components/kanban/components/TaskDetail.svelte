<script lang="ts">
  import { onMount } from 'svelte';
  import type { Task, Comment } from '../../../interfaces/clickup';
  import clickupService from '../../../services/clickup-service';
  import AssigneeBadge from '../../commons/assignees-selector/AssigneeBadge.svelte';
  import Icon from '../../commons/Icon.svelte';
  import CommentText from './CommentText.svelte';
  import { t } from '../../../store/i18n';

  export let task: Task;
  let fullTask: Task;
  let comments: Comment[];
  let collapseDescription = true;
  let collapseComments = true;
  let newComment = '';

  onMount(() => {
    loadTask();
    loadComments();
  });

  async function loadTask() {
    const res = await clickupService.getTask(task.id);
    fullTask = res.data;
  }

  async function loadComments() {
    const res = await clickupService.getTaskComments(task.id);
    comments = res.data;
  }

  async function sendComment(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (newComment?.trim()) {
        const { ok } = await clickupService.createTaskComment(task.id, {
          comment_text: newComment,
          notify_all: true,
        });
        if (ok) {
          newComment = '';
          loadComments();
        }
      }
    }
  }
</script>

<div class="breakspaces">
  {#if !fullTask || !comments}
    <Icon name="cog" class="w-8 animate-spin" />
  {:else}
    <div
      class="text-sm py-3 text-gray-400 of-over pb-10 {collapseDescription &&
        'max-h-60 mask-of'}"
      on:dblclick={() => (collapseDescription = !collapseDescription)}
    >
      {fullTask?.description}
    </div>
    <div class="border-t border-gray-500">
      <div
        class="cursor-pointer text-sm w-full my-2 flex items-center"
        on:click={() => (collapseComments = !collapseComments)}
      >
        <span>{$t('kanban.comments')}</span>
        <Icon
          class="w-4 ml-2 {!collapseComments && 'rotate-180'}"
          name="chevron"
        />
      </div>
      {#if !collapseComments}
        {#each comments as comment}
          <div
            class="flex items-start p-3 mb-2 bg-gray-800 rounded-lg text-gray-400"
          >
            <div class="w-6 flex-none">
              <AssigneeBadge user={comment.user} />
            </div>
            <CommentText class="pl-2" {comment} />
          </div>
        {/each}
        <div>
          <textarea
            class="p-2 mb-2 rounded"
            placeholder={$t('global.add-comment')}
            bind:value={newComment}
            on:keydown={sendComment}
          />
        </div>
      {/if}
    </div>
  {/if}
</div>

<style global>
  .breakspaces * {
    white-space: pre-line;
    word-break: break-all;
  }

  .of-over {
    overflow: overlay;
  }

  .mask-of {
    mask-image: linear-gradient(
      180deg,
      rgba(30, 30, 30, 1) 0%,
      rgba(30, 30, 30, 1) 80%,
      rgba(30, 30, 30, 0) 100%
    );
  }

  .of-over::-webkit-scrollbar {
    width: 1px;
  }
</style>
