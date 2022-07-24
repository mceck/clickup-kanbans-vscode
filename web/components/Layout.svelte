<script lang="ts">
  import { onMount } from "svelte";

  import type {
    List,
    Task,
    User,
    WorkspaceConfig,
  } from "../interfaces/clickup";
  import ClickupService from "../services/clickup-service";
  import { user, userList } from "../store/users";
  import AssigneesSelector from "./AssigneesSelector/AssigneesSelector.svelte";
  import Kanban from "./Kanban.svelte";
  import ListSelector from "./ListSelector/ListSelector.svelte";
  import { spacesTree } from "../store/spaces-tree";
  // @ts-ignore
  import RefreshIcon from "../assets/refresh.svg";
  // @ts-ignore
  import SaveIcon from "../assets/save.svg";
  // @ts-ignore
  import Spinner from "../assets/cog.svg";

  const service = new ClickupService();

  let selectedLists: List[] = [];
  let selectedAssignees: User[] = [];
  let selectedView: any = {};
  let tasks: Task[] = [];
  let filterResp: string;
  let loading = false;
  let viewMode = false;

  $: filteredTasks =
    viewMode && selectedAssignees.length
      ? tasks?.filter((t) =>
          selectedAssignees.reduce(
            (r, t2) => r && t.assignees.map((u) => u.id).includes(t2.id),
            true
          )
        )
      : tasks;

  onMount(async () => {
    const { data } = await service.getUser();
    user.set(data);
    const {
      vsConfig: { assignees, lists, view },
    } = webVscode.getState();
    selectedAssignees = assignees ?? [];
    selectedLists = lists ?? [];
    selectedView = view;
    if (view) {
      viewMode = true;
    }
    if (selectedAssignees.length || selectedLists.length || view) {
      search();
    }

    if ($spacesTree.spaces.length > 0) {
      return;
    }
    service.getAllLists().then((fullTree) => spacesTree.set(fullTree));

    if ($userList.users.length === 0) {
      const { data } = await service.getAllUsers();
      userList.set({ users: data });
    }
  });

  async function search() {
    loading = true;
    if (viewMode) {
      if (!selectedView) {
        return;
      }
      const { data } = await service.getViewTasks(selectedView.id);
      tasks = data;
    } else {
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
    loading = false;
  }

  async function saveFilters() {
    const config: WorkspaceConfig = {
      assignees: selectedAssignees,
      lists: selectedLists,
      view: selectedView,
    };
    if (!viewMode) {
      config.view = undefined;
    }
    filterResp = "";
    let res;
    try {
      res = await service.saveConfig(config);
    } catch (error) {
      res = {
        ok: false,
        error: error.message || "generic_error",
      };
    }
    if (!res.ok) {
      filterResp = res.error;
    } else {
      filterResp = "Saved!";
    }
    setTimeout(() => (filterResp = ""), 3000);
  }

  function toggleView() {
    viewMode = !viewMode;
    tasks = [];
    if (
      (viewMode && selectedView) ||
      (!viewMode && (selectedAssignees.length || selectedLists.length))
    ) {
      search();
    }
  }

  function updateTask(event: CustomEvent<Task>) {
    const task = event.detail;
    tasks = tasks.map((t) => (t.id === task.id ? task : t));
  }
</script>

<div>
  <div>
    <div
      class="flex flex-col-reverse lg:justify-between items-center lg:flex-row"
    >
      <div class="flex justify-start w-full">
        <div class="w-40 lg:w-72 flex-none">
          <AssigneesSelector bind:selectedAssignees />
        </div>
        <div class="w-40 lg:w-80 flex-none">
          <ListSelector
            bind:selectedLists
            bind:selectedView
            right
            {viewMode}
            on:selectView={search}
          />
        </div>
      </div>
      <div class="flex justify-end w-full mb-2">
        <button
          class="w-20 flex-none ml-4 flex items-center"
          on:click={toggleView}>{viewMode ? "ViewMode" : "FilterMode"}</button
        >
        {#if filterResp}
          <span>{filterResp}</span>
        {/if}
        <button
          class="w-20 flex-none ml-4 flex items-center"
          on:click={saveFilters}
        >
          <SaveIcon class="w-5 mr-2" />
          <span>Save</span>
        </button>
        <button class="w-20 flex-none ml-4 flex items-center" on:click={search}>
          <RefreshIcon class="w-5 mr-2" />
          <span>Refresh</span>
        </button>
      </div>
    </div>
    {#if loading}
      <div class="flex w-full justify-center">
        <Spinner class="w-8 animate-spin" />
      </div>
    {:else}
      <Kanban bind:tasks={filteredTasks} on:refresh={updateTask} />
    {/if}
  </div>
</div>

<style global>
  button {
    background-color: theme("colors.primary");
    outline: none !important;
  }

  button:hover {
    background-color: theme("colors.highlight");
    color: white;
  }
</style>
