<script lang="ts">
  import type { User } from "../../interfaces/clickup";

  export let user: User;
</script>

<div class="rounded-full overflow-hidden flex-none">
  {#if user.profilePicture}
    <img src={user.profilePicture} alt="profile-pic" />
  {:else}
    <div
      class="flex justify-center items-center w-8 h-8 text-white"
      style={`background-color: ${user.color}`}
    >
      <span>{user.initials}</span>
    </div>
  {/if}
</div>
