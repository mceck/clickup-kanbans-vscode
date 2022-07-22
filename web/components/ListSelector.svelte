<script lang="ts">
  import { onMount } from 'svelte';
  import type { List } from '../interfaces/clickup';
  import ClickupService from '../services/clickup-service';
  import { spacesTree } from '../store/spaces-tree';

  export let selectedLists: List[];

  let showSpaces = {};
  let showFolder = {};

  onMount(() => {
    if ($spacesTree.spaces.length > 0) {
      return;
    }
    new ClickupService()
      .getAllLists()
      .then((fullTree) => spacesTree.set(fullTree));
  });

  function toggleSpace(spaceId: string) {
    showSpaces = { ...showSpaces, [spaceId]: !showSpaces[spaceId] };
  }

  function toggleFolder(folderId) {
    showFolder = { ...showFolder, [folderId]: !showFolder[folderId] };
  }

  function toggleList(list) {
    const idx = selectedLists.findIndex((l) => l.id === list.id);
    if (idx >= 0) {
      selectedLists = selectedLists.filter((l) => l.id !== list.id);
    } else {
      selectedLists = [...selectedLists, list];
    }
  }
</script>

<div>
  {#if $spacesTree.spaces.length === 0}
    <div>Loading...</div>
  {:else}
    {#each $spacesTree.spaces as space (space.id)}
      <div
        class="cursor-pointer text-green-500"
        on:click={() => toggleSpace(space.id)}
      >
        {space.name}
        {#if showSpaces[space.id]}
          <div on:click|stopPropagation>
            {#each space.folders ?? [] as folder (folder.id)}
              <div
                class="text-yellow-300 ml-4"
                on:click={() => toggleFolder(folder.id)}
              >
                {folder.name}
                {#if showFolder[folder.id]}
                  {#each folder.lists || [] as list}
                    <div
                      class="text-gray-100 ml-4"
                      class:text-blue-300={selectedLists.find(
                        (l) => l.id === list.id
                      )}
                      on:click|stopPropagation={() => toggleList(list)}
                    >
                      {list.name}
                    </div>
                  {/each}
                {/if}
              </div>
            {/each}
            {#each space.lists ?? [] as list (list.id)}
              <div
                class="text-gray-100 ml-4"
                class:text-blue-300={selectedLists.find(
                  (l) => l.id === list.id
                )}
                on:click|stopPropagation={() => toggleList(list)}
              >
                {list.name}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  {/if}
</div>
