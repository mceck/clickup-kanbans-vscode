<script lang="ts">
  import { onMount } from 'svelte';

  import type { List, Task, User } from '../interfaces/clickup';
  import ClickupService from '../services/clickup-service';
  import { user } from '../store/users';
  import AssigneesSelector from './AssigneesSelector.svelte';
  import Kanban from './Kanban.svelte';
  import ListSelector from './ListSelector.svelte';
  const service = new ClickupService();

  let showFilters = false;
  let selectedLists: List[] = [];
  let selectedAssignees: User[] = [];
  let tasks: Task[] = [];

  onMount(async () => {
    const { data } = await service.getUser();
    user.set(data);
  });

  async function search() {
    const params: any = {
      subtasks: true,
    };

    if (selectedLists.length > 0) {
      params.list_ids = selectedLists.map((l) => l.id);
    }

    if (selectedAssignees.length > 0) {
      params.assignees = selectedAssignees.map((u) => u.id);
    }

    const { data } = await service.findTasks(params);
    tasks = data;
  }
</script>

<div>
  <div>
    <button on:click={() => (showFilters = !showFilters)}>toggle</button>
    {#if showFilters}
      <div class="h-48 overflow-auto p-2 border border-gray-600 rounded-lg">
        <AssigneesSelector bind:selectedAssignees />
        <ListSelector bind:selectedLists />
      </div>
    {/if}
    <button on:click={search}>search</button>
    <Kanban bind:tasks />
  </div>
</div>
