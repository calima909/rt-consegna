<template>
  <button ref="btn" class="musicBtn" @click="toggleMusic">
    {{ isPlaying ? '🔊 Music ON' : '🔇 Music OFF' }}
  </button>
</template>

<script setup>
import { ref } from 'vue'
import audio from '../logic/music.js'

const btn = ref(null)
const isPlaying = ref(!audio.paused)

function toggleMusic() {
  if (isPlaying.value) {
    audio.pause()
  } else {
    audio.play()
  }
  isPlaying.value = !isPlaying.value
}
</script>

<style scoped>
.musicBtn {
  position: fixed;
  top: 1rem;
  right: 4rem;
  padding: 2rem;
  background: #222;
  color: #fff;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 0.4rem 0.7rem;
  cursor: pointer;
  font-family: inherit;
  z-index: 10;
}

</style>
