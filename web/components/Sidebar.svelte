<script lang="ts">
  import { onMount } from 'svelte';
  import ClickupService from '../services/clickup-service';
  import Layout from './Layout.svelte';

  let spaces = [];
  let folders = [];
  let tasks = [];

  onMount(async () => {
    const service = new ClickupService();
    let result = await service.getSpaces();
    spaces = result.data;
    result = await service.getFolders('60166291');
    folders = result.data;
    result = await service.getTasks('210049359', { subtasks: true });
    result = await service.findTasks({
      assignees: [48914719],
      subtasks: true,
    });
    tasks = result.data;
    result = await service.getList('210049359');
  });
</script>

<pre class="text-red-500">spaces: {JSON.stringify(spaces)}</pre>
<pre class="text-green-500">folders: {JSON.stringify(folders)}</pre>
<pre class="text-blue-400">tasks: {JSON.stringify(tasks)}</pre>
<Layout />

<style global lang="postcss">
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
</style>
