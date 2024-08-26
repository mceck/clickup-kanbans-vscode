<script lang="ts">
  import type { User } from '../../../interfaces/clickup';

  export let user: User;
  export let small = false;
</script>

<div
  class="rounded-full overflow-hidden flex-none w-full h-full {$$props.class}"
  title={user.username}
>
  {#if user.profilePicture}
    <img src={user.profilePicture} alt="profile-pic" />
  {:else}
    <div
      class="flex justify-center items-center w-full h-full text-white"
      class:text-[7px]={small}
      style={`background-color: ${user.color || '#6932bc'}`}
    >
      <span>{user.initials}</span>
    </div>
  {/if}
</div>
