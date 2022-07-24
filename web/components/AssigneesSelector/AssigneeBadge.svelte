<script lang="ts">
  import type { User } from "../../interfaces/clickup";

  export let user: User;
  export let small = false;
</script>

<div class="rounded-full overflow-hidden flex-none">
  {#if user.profilePicture}
    <img src={user.profilePicture} alt="profile-pic" />
  {:else}
    <div
      class="flex justify-center items-center w-full h-full text-white"
      class:text-xs={small}
      style={`background-color: ${user.color}`}
    >
      <span>{user.initials}</span>
    </div>
  {/if}
</div>
