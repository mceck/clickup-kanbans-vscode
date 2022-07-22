<script lang="ts">
  import { space } from 'svelte/internal';
  import { FoldingRange } from 'vscode';
  import { spacesTree } from '../store/spaces-tree';

  let showSpaces = {};
  let showFolder = {};

  function toggleSpace(spaceId: string) {
    showSpaces = { ...showSpaces, [spaceId]: !showSpaces[spaceId] };
  }

  function toggleFolder(folderId) {
    showFolder = { ...showFolder, [folderId]: !showFolder[folderId] };
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
                class="text-yellow-300"
                on:click={() => toggleFolder(folder.id)}
              >
                {folder.name}
                {#if showFolder[folder.id]}
                  {#each folder.lists || [] as list}
                    <div on:click|stopPropagation class="text-gray-100">
                      {list.name}
                    </div>
                  {/each}
                {/if}
              </div>
            {/each}
            {#each space.lists ?? [] as list (list.id)}
              <div class="text-gray-400">{list.name}</div>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  {/if}
</div>
