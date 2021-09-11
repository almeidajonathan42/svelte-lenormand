<script>
  import Home from "./views/Home.svelte";
  import Reading from "./views/Reading.svelte";

  import { appState } from "./stores.js";
</script>

<style>
  main {
    font-family: sans-serif;
    text-align: center;
  }
</style>

<main>
  {#if $appState == 'home'}
    <Home />
  {:else if $appState == 'reading'}
    <Reading />
  {/if}
</main>