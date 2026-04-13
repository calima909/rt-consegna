 <script setup>
  import Music from './components/Music.vue'
</script>

<template>
  <main class="p-4">
    <router-view />
    <Music />
  </main>
</template>

<style>
body {
  background: #121212;
  color: #fff;
  font-family: 'JetBrains Mono', monospace;
}
main {
  max-width: 600px;
  margin: auto;
}
</style>
