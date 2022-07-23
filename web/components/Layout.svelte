<script lang="ts">
  import { onMount } from "svelte";

  import type {
    List,
    Task,
    User,
    WorkspaceFilters,
  } from "../interfaces/clickup";
  import ClickupService from "../services/clickup-service";
  import { user } from "../store/users";
  import AssigneesSelector from "./AssigneesSelector/AssigneesSelector.svelte";
  import Kanban from "./Kanban.svelte";
  import ListSelector from "./ListSelector/ListSelector.svelte";
  const service = new ClickupService();

  let selectedLists: List[] = [];
  let selectedAssignees: User[] = [];
  let tasks: Task[] = [];
  let filterResp: string;

  onMount(async () => {
    const { data } = await service.getUser();
    user.set(data);
    const {
      wsConfig: { assignees, lists },
    } = webVscode.getState();
    selectedAssignees = assignees ?? [];
    selectedLists = lists ?? [];
    if (selectedAssignees.length || selectedLists.length) {
      search();
    }
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

  async function saveFilters() {
    const config: WorkspaceFilters = {
      assignees: selectedAssignees,
      lists: selectedLists,
    };
    filterResp = "";
    const res = await service.saveConfig(config);
    if (!res.ok) {
      filterResp = res.error;
    } else {
      filterResp = "Saved!";
    }
  }
</script>

<div>
  <div>
    <div
      class="flex flex-col-reverse lg:justify-between items-center lg:flex-row"
    >
      <div class="flex justify-start w-full">
        <div class="w-52 lg:w-72 flex-none">
          <AssigneesSelector bind:selectedAssignees />
        </div>
        <div class="w-40 lg:w-80 flex-none">
          <ListSelector bind:selectedLists right />
        </div>
      </div>
      <div class="flex justify-end w-full mb-2">
        {#if filterResp}
          <span>{filterResp}</span>
        {/if}
        <button class="w-20 flex-none" on:click={saveFilters}>💾 Save</button>
        <button class="w-20 flex-none ml-4" on:click={search}>🔍 Search</button>
      </div>
    </div>
    <Kanban bind:tasks />
  </div>
</div>

<style>
  .filter-w {
    width: calc(100% - 3rem);
  }
</style>
