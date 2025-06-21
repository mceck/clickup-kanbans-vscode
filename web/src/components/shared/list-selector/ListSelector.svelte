<script lang="ts">
  import type { Folder, List, Space, View } from '../../../interfaces/clickup';
  import { spacesTree } from '../../../store/workspace';
  import SpaceBadge from './SpaceBadge.svelte';
  import clickupService from '../../../services/clickup-service';
  import Icon from '../Icon.svelte';
  import { outsideClickable } from '../../utils/clickOutside';
  import { t } from '../../../store/i18n';

  interface Props {
    selectedLists?: List[];
    right?: boolean;
    selectedView: View | null;
    viewMode?: boolean;
    onRemoveList?: (list: List) => void;
    onSelectList?: (list: List) => void;
    onSelectView?: (view: View) => void;
  }

  let {
    selectedLists = $bindable([]),
    right = false,
    selectedView = $bindable(null),
    viewMode = false,
    onRemoveList,
    onSelectList,
    onSelectView,
  }: Props = $props();

  let showSpaces: any = $state({});
  let showFolder: Record<string, boolean> = $state({});
  let views: Record<string, View[] | null | undefined> = $state({});
  let viewCache: Record<string, View[]> = {}; // Assuming viewCache only stores actual views

  let scroller: HTMLElement | null = $state(null);
  let searchInput: HTMLInputElement | null = $state(null);
  let searchText = $state('');
  let showSelector = $state(false);
  let selected = $state(-1);

  let filteredSpaces = $derived(
    ($spacesTree.spaces as Space[]).map((s: Space) => {
      if (!searchText) {
        return s;
      }
      const ret = { ...s };
      ret.folders =
        ret.folders
          ?.map((f: Folder) => {
            const fret = { ...f };
            fret.lists =
              fret.lists?.filter((l: List) =>
                l.name.toLowerCase().includes(searchText.toLowerCase())
              ) ?? [];
            return fret;
          })
          ?.filter(
            (f: Folder) =>
              f.lists?.length ||
              f.name.toLowerCase().includes(searchText.toLowerCase())
          ) ?? [];
      ret.lists =
        ret.lists?.filter((l: List) =>
          l.name.toLowerCase().includes(searchText.toLowerCase())
        ) ?? [];
      return ret;
    })
  );

  function handleSearching() {
    if (searchText) {
      showSpaces = filteredSpaces.reduce(
        (prev, current) => ({ ...prev, [current.id]: true }),
        {}
      );
      showFolder = filteredSpaces.reduce(
        (prev, current) => ({
          ...prev,
          ...current.folders?.reduce((o, f) => ({ ...o, [f.id]: true }), {}),
        }),
        {}
      );
    }
  }

  function handleKeyboard(event: KeyboardEvent) {
    const recNumber =
      filteredSpaces.length +
      filteredSpaces.reduce(
        (p, s) =>
          p +
          (s.folders?.length ?? 0) +
          (s.folders?.reduce((a, b) => a + (b.lists?.length ?? 0), 0) ?? 0) +
          (s.lists?.length ?? 0),
        0
      );
    switch (event.key) {
      case 'Enter':
        const [type, rec] = getRecord(selected);
        if (rec) {
          switch (type) {
            case 'space':
              toggleSpace(rec.id);
              break;
            case 'folder':
              toggleFolder(rec.id);
              break;
            case 'list':
              toggleList(rec);
              break;
          }
        }
        break;
      case 'Escape':
        toggleSelector();
        break;
      case 'ArrowDown':
        selected = (selected + 1) % recNumber;
        if (scroller) {
          scroller.scrollTop = selected * 20 - 40;
        }
        break;
      case 'ArrowUp':
        selected--;
        if (selected < 0) {
          selected = recNumber - 1;
        }
        if (scroller) {
          scroller.scrollTop = selected * 20 - 40;
        }
        break;
    }
  }

  function getIdx(
    type: 'space' | 'folder' | 'list',
    obj: List | Folder | Space
  ) {
    let i = 0;
    for (let s of filteredSpaces) {
      if (type === 'space' && obj.id === s.id) {
        return i;
      }
      i++;
      if (!showSpaces[s.id]) {
        continue;
      }
      for (let f of s.folders ?? []) {
        if (type === 'folder' && obj.id === f.id) {
          return i;
        }
        i++;
        if (!showFolder[f.id]) {
          continue;
        }
        for (let l of f.lists ?? []) {
          if (type === 'list' && obj.id === l.id) {
            return i;
          }
          i++;
        }
      }
      for (let l of s.lists ?? []) {
        if (type === 'list' && obj.id === l.id) {
          return i;
        }
        i++;
      }
    }
    return -2;
  }

  function getRecord(idx: number): ['space' | 'folder' | 'list', any] {
    let i = 0;
    for (let s of filteredSpaces) {
      if (i === idx) {
        return ['space', s];
      }
      i++;
      if (!showSpaces[s.id]) {
        continue;
      }
      for (let f of s.folders ?? []) {
        if (i === idx) {
          return ['folder', f];
        }
        i++;
        if (!showFolder[f.id]) {
          continue;
        }
        for (let l of f.lists ?? []) {
          if (i === idx) {
            return ['list', l];
          }
          i++;
        }
      }
      for (let l of s.lists ?? []) {
        if (i === idx) {
          return ['list', l];
        }
        i++;
      }
    }
    throw new Error();
  }

  async function toggleSpace(spaceId: string) {
    const space = $spacesTree.spaces.find((s) => s.id === spaceId)!;
    if (!space.folders?.length && !space.lists?.length) {
      const [{ data: folders }, { data: lists }] = await Promise.all([
        clickupService.getFolders(space.id),
        clickupService.getFolderlessLists(space.id),
      ]);
      space.folders = folders ?? [];
      space.lists = lists ?? [];
      clickupService.setCache('spaces', $spacesTree);
    }
    showSpaces = { ...showSpaces, [spaceId]: !showSpaces[spaceId] };
    searchText = '';
  }

  function toggleFolder(folderId: string) {
    showFolder = { ...showFolder, [folderId]: !showFolder[folderId] };
    searchText = '';
  }

  function toggleList(list: List) {
    const idx = selectedLists.findIndex((l) => l.id === list.id);
    if (viewMode) {
      if (viewCache[list.id]) {
        views = { ...views, [list.id]: viewCache[list.id] };
      } else {
        views = { ...views, [list.id]: null } as any;
        clickupService.getListViews(list.id).then(({ data }) => {
          const viewList = data.map((v: any) => ({ ...v, list }));
          views = { ...views, [list.id]: viewList };
          viewCache[list.id] = viewList;
        });
      }
    } else if (idx >= 0) {
      selectedLists = selectedLists.filter((l) => l.id !== list.id);
      views = { ...views, [list.id]: undefined } as any;
      onRemoveList?.(list);
    } else {
      selectedLists = [...selectedLists, list];
      onSelectList?.(list);
    }
    searchText = '';
  }

  function selectView(view: View) {
    selectedView = view;
    toggleSelector();
    onSelectView?.(view);
  }

  function toggleSelector() {
    showSelector = !showSelector;
    if (showSelector) {
      setTimeout(() => searchInput?.focus(), 0);
      searchText = '';
      selected = -1;
    }
  }
</script>

<div class:animate-pulse={$spacesTree.spaces.length === 0}>
  <div
    class="relative select-none"
    use:outsideClickable
    onclickOutside={() => (showSelector = false)}
  >
    <input
      class="!rounded-full p-input cursor-pointer"
      bind:this={searchInput}
      bind:value={searchText}
      oninput={handleSearching}
      onkeydown={handleKeyboard}
      onclick={toggleSelector}
      placeholder={viewMode
        ? selectedView
          ? `${selectedView.list?.name}: ${selectedView.name}`
          : $t('global.select-view')
        : selectedLists.length
          ? `(${selectedLists.length} list${
              selectedLists.length > 1 ? 's' : ''
            } selected)`
          : $t('global.select-list')}
    />
    {#if showSelector}
      <div
        class="absolute top-12 overflow-hidden rounded-lg shadow border border-gray-400 bg-screen z-10"
        class:right-1={right}
      >
        <div class="overflow-auto w-72 h-80" bind:this={scroller}>
          {#each filteredSpaces as space (space.id)}
            <div
              class="cursor-pointer px-2 py-1"
              onclick={() => toggleSpace(space.id)}
            >
              <div
                class="flex items-center hover:text-white"
                class:bg-gray-700={getIdx('space', space) === selected}
              >
                <span class="w-6 h-6 mr-2"><SpaceBadge {space} /></span>
                <span>
                  {space.name}
                </span>
              </div>
              {#if showSpaces[space.id]}
                <div onclick={(e: Event) => e.stopPropagation()}>
                  {#each space.folders ?? [] as folder (folder.id)}
                    <div class="ml-4">
                      <div
                        class="flex items-center hover:text-white"
                        class:bg-gray-700={getIdx('folder', folder) ===
                          selected}
                        onclick={() => toggleFolder(folder.id)}
                      >
                        {#if showFolder[folder.id]}
                          <Icon class="w-4 h-4 flex-none" name="folder-open" />
                        {:else}
                          <Icon class="w-4 h-4 flex-none" name="folder" />
                        {/if}
                        <span class="ml-2">{folder.name}</span>
                      </div>

                      {#if showFolder[folder.id]}
                        {#each folder.lists || [] as list}
                          <div
                            class="ml-4 flex items-center hover:text-white"
                            class:bg-gray-700={getIdx('list', list) ===
                              selected}
                            class:text-blue-300={!viewMode &&
                              selectedLists.find((l) => l.id === list.id)}
                            onclick={() => toggleList(list)}
                          >
                            <span
                              class="w-2 h-2 mr-2 rounded-full border border-dashed border-gray-400"
                            ></span>
                            <span>
                              {list.name}
                            </span>
                          </div>
                          {#if viewMode}
                            {#if views[list.id] === null}
                              <Icon
                                class="ml-8 w-4 h-4 flex-none animate-spin"
                                name="cog"
                              />
                            {/if}
                            {#if views[list.id] !== null && views[list.id]?.length === 0}
                              <small class="ml-8 text-gray-400"
                                >{$t('global.empty')}</small
                              >
                            {/if}
                            {#each views[list.id] ?? [] as view (view.id)}
                              <div
                                class="ml-8 flex items-center"
                                onclick={() => selectView(view)}
                              >
                                <span
                                  class=" w-2 h-2 mr-2 rounded-full border border-dotted border-gray-400"
                                ></span>
                                <span
                                  class="hover:text-blue-50"
                                  class:text-blue-200={view.id ===
                                    selectedView?.id}
                                >
                                  {view.name}
                                </span>
                              </div>
                            {/each}
                          {/if}
                        {/each}
                      {/if}
                    </div>
                  {/each}
                  {#each space.lists ?? [] as list (list.id)}
                    <div
                      class="ml-4 flex items-center hover:text-white"
                      class:bg-gray-700={getIdx('list', list) === selected}
                      class:text-blue-300={!viewMode &&
                        !!selectedLists.find((l) => l.id === list.id)}
                      onclick={(e: Event) => {
                        e.stopPropagation();
                        toggleList(list);
                      }}
                    >
                      <span
                        class="w-2 h-2 mr-2 rounded-full border border-dashed border-gray-400"
                      ></span>
                      <span>{list.name}</span>
                    </div>
                    {#if viewMode}
                      {#if views[list.id] === null}
                        <Icon
                          class="ml-8 w-4 h-4 flex-none animate-spin"
                          name="cog"
                        />
                      {/if}
                      {#if views[list.id] !== null && views[list.id]?.length === 0}
                        <small class="ml-8 text-gray-400"
                          >{$t('global.empty')}</small
                        >
                      {/if}
                      {#each views[list.id] ?? [] as view (view.id)}
                        <div
                          class="ml-8 flex items-center hover:text-white"
                          onclick={() => selectView(view)}
                        >
                          <span
                            class=" w-2 h-2 mr-2 rounded-full border border-dotted border-gray-400"
                          ></span>
                          <span
                            class:text-blue-300={view.id === selectedView?.id}
                          >
                            {view.name}
                          </span>
                        </div>
                      {/each}
                    {/if}
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .p-input {
    padding-left: 1rem !important;
    padding-right: 1rem !important;
  }
</style>
