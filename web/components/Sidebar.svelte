<script lang="ts">
  import { onMount } from 'svelte';
  import ClickupService from '../services/clickup-service';

  let user = {};

  onMount(() => {
    const service = new ClickupService();
    service.getUser().then((u) => {
      console.log('USER', u);
      user = u;
    });
  });
</script>

<div class="text-red-500">{JSON.stringify(user)}</div>

<style global lang="postcss">
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
</style>
