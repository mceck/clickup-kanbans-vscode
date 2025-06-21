<script lang="ts">
  import type { User } from '../../../interfaces/clickup';

  interface Props {
    user: User;
    small?: boolean;
    class?: string;
  }

  let props: Props = $props();
</script>

<div
  class="rounded-full overflow-hidden flex-none w-full h-full {props.class}"
  title={props.user.username}
>
  {#if props.user.profilePicture}
    <img src={props.user.profilePicture} alt="profile-pic" />
  {:else}
    <div
      class="flex justify-center items-center w-full h-full text-white"
      class:text-[7px]={props.small}
      style={`background-color: ${props.user.color || '#6932bc'}`}
    >
      <span>{props.user.initials}</span>
    </div>
  {/if}
</div>
