<script lang="ts">
  import { onMount } from "svelte";

  import type { User } from "../../interfaces/clickup";
  import ClickupService from "../../services/clickup-service";
  import { userList } from "../../store/users";
  import AddAssigneeButton from "./AddAssigneeButton.svelte";
  import AssigneeBadge from "./AssigneeBadge.svelte";
  // @ts-ignore
  import Spinner from "../../assets/cog.svg";

  export let selectedAssignees: User[];

  let showSelector = false;
  let searchText = "";
  let searchInput: HTMLInputElement;
  let scroller: HTMLElement;

  let selected = -1;

  onMount(async () => {
    if ($userList.users.length === 0) {
      const { data } = await new ClickupService().getAllUsers();
      userList.set({ users: data });
    }
  });

  $: filteredUsers = $userList.users.filter((u) => {
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
  });

  function toggleAssignee(user) {
    if (selectedAssignees.find((u) => u.id === user.id)) {
      selectedAssignees = selectedAssignees.filter((u) => u.id !== user.id);
    } else {
      selectedAssignees = [...selectedAssignees, user];
    }
  }

  function toggleSelector() {
    showSelector = !showSelector;
    if (showSelector) {
      setTimeout(() => searchInput.focus(), 0);
      searchText = "";
      selected = -1;
    }
  }

  function handleKeyboard(event: KeyboardEvent) {
    switch (event.key) {
      case "Enter":
        if (selected >= 0) {
          toggleAssignee(filteredUsers[selected]);
          searchText = "";
          selected = filteredUsers.length > 0 ? 0 : -1;
        }
        break;
      case "Escape":
        toggleSelector();
        break;
      case "ArrowDown":
        selected = (selected + 1) % filteredUsers.length;
        scroller.scrollTop = selected * 40 - 80;
        event.preventDefault();
        break;
      case "ArrowUp":
        selected--;
        if (selected < 0) {
          selected = filteredUsers.length - 1;
        }
        scroller.scrollTop = selected * 40 - 80;
        event.preventDefault();
        break;
    }
  }
</script>

<svelte:window on:click={() => (showSelector = false)} />

<div>
  {#if $userList.users.length === 0}
    <Spinner class="w-8 animate-spin" />
  {:else}
    <div class="relative select-none">
      <div class="flex flex-row-reverse justify-end pl-3">
        <div
          class="-ml-2 w-8 h-8 cursor-pointer"
          on:click|stopPropagation={toggleSelector}
        >
          <AddAssigneeButton />
        </div>
        {#each selectedAssignees as user (user.id)}
          <div class="-ml-3 w-8 h-8 cursor-pointer">
            <span on:click|stopPropagation={() => toggleAssignee(user)}>
              <AssigneeBadge {user} />
            </span>
          </div>
        {/each}
      </div>
      {#if showSelector}
        <div
          class="absolute top-12 rounded-lg shadow border border-gray-500 overflow-hidden bg-screen z-10"
          on:click|stopPropagation
        >
          <input
            class="w-full search"
            placeholder="Search..."
            bind:this={searchInput}
            bind:value={searchText}
            on:keydown={handleKeyboard}
            on:input={() => (selected = filteredUsers.length ? 0 : -1)}
          />
          <div class="w-80 h-80 overflow-auto" bind:this={scroller}>
            {#each filteredUsers as user, idx (user.id)}
              <div
                class="flex items-center cursor-pointer px-4 py-2"
                class:bg-gray-700={idx === selected}
                on:click={() => toggleAssignee(user)}
                on:mouseenter={() => (selected = idx)}
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
  {/if}
</div>

<style>
  .search {
    outline: none;
  }
</style>
