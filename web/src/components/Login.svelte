<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import clickupService from '../services/clickup-service';
  import { t } from '../store/i18n';

  const dispatch = createEventDispatcher();
  let personalToken = $state('');

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

<h1 class="text-lg mb-4">{$t('login.token-info')}</h1>
<div class="flex mb-8">
  <input
    id="token"
    name="token"
    placeholder={$t('login.personal-token')}
    bind:value={personalToken}
  />
  <button class="w-2/5 bg-primary" onclick={setToken}
    >{$t('login.set-token')}</button
  >
</div>
<p>
  {$t('login.info-pre')}<a
    class="text-primary"
    href="https://clickup.com/api/developer-portal/authentication/"
    >{$t('login.info-link')}</a
  >{$t('login.info-post')}
</p>
