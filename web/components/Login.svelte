<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import clickupService from '../services/clickup-service';

  const dispatch = createEventDispatcher();
  let personalToken = '';

  async function setToken() {
    if (!personalToken) {
      return;
    }
    const res = await clickupService.login(personalToken);
    if (res.ok) {
      dispatch('loggedIn', res.data);
    } else {
      personalToken = '';
    }
  }
</script>

<h1 class="text-lg mb-4">Please enter ClickUp personal token</h1>
<div class="flex mb-8">
  <input
    id="token"
    name="token"
    placeholder="Personal token"
    bind:value={personalToken}
  />
  <button class="w-2/5 bg-primary" on:click={setToken}>Set token</button>
</div>
<p>
  Follow the <a
    class="text-primary"
    href="https://clickup.com/api/developer-portal/authentication/"
    >OFFICIAL GUIDE</a
  > to obtain a Personal token
</p>
