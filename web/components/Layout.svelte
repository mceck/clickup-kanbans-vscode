<script lang="ts">
  import { onMount } from 'svelte';
  import ClickupService from '../services/clickup-service';
  import { spacesTree } from '../store/spaces-tree';
  import ListSelector from './ListSelector.svelte';

  onMount(() => {
    new ClickupService()
      .getAllLists()
      .then((fullTree) => spacesTree.set(fullTree));
  });
</script>

<div>
  <ListSelector />
</div>
