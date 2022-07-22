<script lang="ts">
  import { onMount } from 'svelte';

  import type { User } from '../interfaces/clickup';
  import ClickupService from '../services/clickup-service';
  import { userList } from '../store/users';

  export let selectedAssignees: User[];

  onMount(async () => {
    if ($userList.users.length === 0) {
      const { data } = await new ClickupService().getAllUsers();
      userList.set({ users: data });
    }
  });

  $: filteredUsers = $userList.users.filter((u) => {
    return u.role !== 4;
  });

  function toggleAssignee(user) {
    if (selectedAssignees.find((u) => u.id === user.id)) {
      selectedAssignees = selectedAssignees.filter((u) => u.id !== user.id);
    } else {
      selectedAssignees = [...selectedAssignees, user];
    }
  }
</script>

<div>
  {#if $userList.users.length === 0}
    <div>Loading...</div>
  {:else}
    {#each filteredUsers as user (user.id)}
      <div
        class="text-yellow-600 cursor-pointer"
        class:text-green-500={selectedAssignees.find((u) => u.id === user.id)}
        on:click={() => toggleAssignee(user)}
      >
        {user.username}
      </div>
    {/each}
  {/if}
</div>
