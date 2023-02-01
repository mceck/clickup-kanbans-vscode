<script lang="ts">
  import { loading } from '../../store/suspender';
  import Icon from './Icon.svelte';
</script>

<slot />
{#if $loading}
  <div
    class="fixed z-50 top-0 left-0 w-screen h-screen flex justify-center items-center backdrop-blur-sm fade-in ani"
    on:click|stopPropagation
  >
    <Icon name="cog" class="w-10 animate-spin" />
  </div>
{/if}

<style>
  @keyframes fade {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
  .fade-in {
    animation: fade 250ms ease;
  }
</style>
