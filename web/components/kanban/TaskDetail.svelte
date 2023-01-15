<script lang="ts">
  import { onMount } from 'svelte';
  import type { Task, Comment } from '../../interfaces/clickup';
  import clickupService from '../../services/clickup-service';
  import AssigneeBadge from '../commons/assignees-selector/AssigneeBadge.svelte';
  import Icon from '../commons/Icon.svelte';

  export let task: Task;
  let fullTask: Task;
  let comments: Comment[];

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
</script>

<div class="breakspaces">
  {#if !fullTask || !comments}
    <Icon name="cog" class="w-8 animate-spin" />
  {:else}
    <pre class="text-sm py-3 text-gray-400">{fullTask?.description}</pre>
    <div class="border-t border-gray-500">
      <small class="mt-2">Comments:</small>
      {#each comments as comment}
        <div
          class="flex items-start p-3 my-2 bg-gray-800 rounded-lg text-gray-400"
        >
          <div class="w-6 flex-none">
            <AssigneeBadge user={comment.user} />
          </div>
          <div class="pl-2">
            {#each comment.comment as detail}
              {#if detail.type === 'frame' || detail.attributes?.link}
                <a
                  class="text-primary"
                  href={detail.frame?.url || detail.attributes?.link}
                  >{detail.text}</a
                >
              {:else}
                <pre class="text-sm">{detail.text}</pre>
              {/if}
            {/each}
          </div>
          <!-- <p class="pl-2">{comment.comment_text}</p> -->
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .breakspaces * {
    white-space: break-spaces;
    word-break: break-all;
  }
</style>
