<script lang="ts">
  import { onMount } from 'svelte';
  import type { Task, Comment } from '../../interfaces/clickup';
  import clickupService from '../../services/clickup-service';
  import AssigneeBadge from '../commons/assignees-selector/AssigneeBadge.svelte';
  import Icon from '../commons/Icon.svelte';
  import CommentText from './CommentText.svelte';

  export let task: Task;
  let fullTask: Task;
  let comments: Comment[];
  let collapsed = true;

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
    console.log(comments);
  }
</script>

<div class="breakspaces">
  {#if !fullTask || !comments}
    <Icon name="cog" class="w-8 animate-spin" />
  {:else}
    <div
      class="text-sm py-3 text-gray-400 of-over {collapsed &&
        'max-h-60 mask-of pb-10'}"
      on:click={() => (collapsed = !collapsed)}
    >
      {fullTask?.description}
    </div>
    <div class="border-t border-gray-500 max-h-80 of-over">
      <small class="mt-2">Comments:</small>
      {#each comments as comment}
        <div
          class="flex items-start p-3 my-2 bg-gray-800 rounded-lg text-gray-400"
        >
          <div class="w-6 flex-none">
            <AssigneeBadge user={comment.user} />
          </div>
          <CommentText class="pl-2" {comment} />
        </div>
      {/each}
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
