<script lang="ts">
  import type { User } from '../../../interfaces/clickup';
  import { userList } from '../../../store/workspace';
  import AssigneeBadge from './AssigneeBadge.svelte';
  import Icon from '../Icon.svelte';
  import { outsideClickable } from '../../utils/clickOutside';
  import { t } from '../../../store/i18n';

  interface Props {
    selectedAssignees: User[];
    editable?: boolean;
    maxShown?: number;
    small?: boolean;
    manual?: boolean;
    anchor?: 'left' | 'right';
    onRemove?: (user: User) => void;
    onAdd?: (user: User) => void;
  }

  let {
    selectedAssignees = $bindable(),
    editable = true,
    maxShown = 99,
    small = false,
    manual = false,
    anchor = 'left',
    onRemove,
    onAdd,
  }: Props = $props();

  let showSelector = $state(false);
  let searchText = $state('');
  let searchInput: HTMLInputElement | null = $state(null);
  let scroller: HTMLElement | null = $state(null);

  let selected = $state(-1);

  let showedAssignees = $derived(
    selectedAssignees.slice(
      0,
      maxShown === selectedAssignees.length ? maxShown : maxShown - 1
    )
  );

  let filteredUsers = $derived(
    $userList.users.filter((u) => {
      if (u.role >= 4) {
        return false;
      }
      if (selectedAssignees.find((s) => s.id === u.id)) {
        return false;
      }
      if (
        searchText &&
        !u.username.toLowerCase().includes(searchText.toLowerCase())
      ) {
        return false;
      }
      return true;
    })
  );

  function toggleAssignee(user: any) {
    if (!editable) {
      return;
    }
    if (selectedAssignees.find((u) => u.id === user.id)) {
      if (!manual) {
        selectedAssignees = selectedAssignees.filter((u) => u.id !== user.id);
      }
      onRemove?.(user);
    } else {
      if (!manual) {
        selectedAssignees = [...selectedAssignees, user];
      }
      onAdd?.(user);
    }
  }

  function toggleSelector() {
    if (!editable) {
      return;
    }
    showSelector = !showSelector;
    if (showSelector) {
      setTimeout(() => searchInput?.focus(), 0);
      searchText = '';
      selected = -1;
    }
  }

  function handleKeyboard(event: KeyboardEvent) {
    switch (event.key) {
      case 'Enter':
        if (selected >= 0) {
          toggleAssignee(filteredUsers[selected]);
          searchText = '';
          selected = filteredUsers.length > 0 ? 0 : -1;
        }
        break;
      case 'Escape':
        toggleSelector();
        break;
      case 'ArrowDown':
        selected = (selected + 1) % filteredUsers.length;
        if (scroller) {
          scroller.scrollTop = selected * 40 - 80;
        }
        event.preventDefault();
        break;
      case 'ArrowUp':
        selected--;
        if (selected < 0) {
          selected = filteredUsers.length - 1;
        }
        if (scroller) {
          scroller.scrollTop = selected * 40 - 80;
        }
        event.preventDefault();
        break;
    }
  }
</script>

<div class:animate-pulse={$userList.users.length === 0}>
  <div
    class="relative select-none"
    use:outsideClickable
    onclickOutside={() => (showSelector = false)}
  >
    <div class="flex flex-row-reverse justify-end pl-3">
      {#if editable}
        <div
          class={`${
            small ? 'w-5 h-5 -ml-2' : 'w-8 h-8 -ml-2'
          } cursor-pointer stroke-highlight fill-highlight hover:stroke-blue-300 hover:fill-blue-300 rounded-full backdrop-blur-[2px] bg-black20`}
          onclick={toggleSelector}
        >
          <Icon class="w-full" name="add-assignee" />
        </div>
      {/if}
      {#if selectedAssignees.length > maxShown}
        <div
          class={`cursor-pointer flex justify-center items-center ${
            small ? 'w-5 h-5 -ml-2 text-xs' : 'w-8 h-8 -ml-3'
          } text-white bg-gray-500 rounded-full`}
          onclick={toggleSelector}
        >
          <span>+{selectedAssignees.length - maxShown + 1}</span>
        </div>
      {/if}
      {#each showedAssignees as user (user.id)}
        <div
          class={`${small ? 'w-5 h-5 -ml-2' : 'w-8 h-8 -ml-3'} cursor-pointer`}
        >
          <span onclick={() => toggleAssignee(user)}>
            <AssigneeBadge {user} {small} />
          </span>
        </div>
      {/each}
    </div>
    {#if showSelector}
      <div
        class="absolute top-[125%] rounded-lg shadow border border-gray-500 overflow-hidden bg-screen z-10 {anchor ===
          'right' && 'right-1'}"
      >
        <input
          class="w-full outline-none!"
          placeholder={$t('global.search')}
          bind:this={searchInput}
          bind:value={searchText}
          onkeydown={handleKeyboard}
          oninput={() => (selected = filteredUsers.length ? 0 : -1)}
        />
        <div class="w-64 h-80 overflow-auto" bind:this={scroller}>
          {#each filteredUsers as user, idx (user.id)}
            <div
              class="flex items-center cursor-pointer px-4 py-2"
              class:bg-black20={idx === selected}
              onclick={() => toggleAssignee(user)}
              onmouseenter={() => (selected = idx)}
            >
              <span class="w-8 h-8">
                <AssigneeBadge {user} />
              </span>
              <span class="ml-2">{user.username}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .add-assignee :global(circle) {
    stroke-dasharray: 3;
  }
</style>
