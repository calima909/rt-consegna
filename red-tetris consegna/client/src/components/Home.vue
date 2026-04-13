<template>
  <div class="home">
    <div class="leaderboard">
      <h2>🏆 TOP 10</h2>
      <ol>
        <li v-for="(s, i) in scores" :key="i">
          <span class="name">{{ s.player }}</span>
          <span class="score">{{ s.score }}</span>
        </li>
      </ol>
    </div>

    <div class="title-box">
      <h1 class="neon-title">RED TETRIS</h1>
      <div class="scanlines"></div>
    </div>

    <div class="container">
      <p class="subtitle">Inserisci il nome della stanza e il tuo nickname per iniziare</p>    
      
      <form @submit.prevent="joinGame" class="game-form">
        <div class="input-group">
          <input 
            v-model="room" 
            placeholder="Nome stanza" 
            required 
            :pattern="noOnlySpacesPattern"
            title="Inserisci un nome valido"
            class="retro-input"
          />
          <input 
            v-model="player" 
            placeholder="Il tuo nome" 
            required 
            :pattern="noOnlySpacesPattern"
            title="Inserisci un nome valido"
            class="retro-input"
          />
        </div>
        <div class="button-group">
          <button type="button" @click="toggleSinglePlayer" class="retro-btn single-btn">
            <span class="btn-text">SINGLEPLAYER</span>
          </button>
        </div>
        <br>
        <div class="button-group">
          <button type="submit" class="retro-btn multi-btn">
            <span class="btn-text">VERSUS</span>
          </button>
        </div>
      </form>

      <transition name="slide">
        <div v-if="showOptions" class="options-panel">
          <div class="panel-header">
            <span class="blink">▶</span> GAME OPTIONS
          </div>

          <div class="option-section">
            <label class="option-label">MODE</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="gameMode" value="survival" />
                <span class="radio-custom"></span>
                <span class="radio-text">SURVIVAL</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="gameMode" value="stage" />
                <span class="radio-custom"></span>
                <span class="radio-text">STAGE</span>
              </label>
            </div>
          </div>

          <div class="option-section">
            <label class="option-label">SPEED</label>
            <div class="radio-group speed-group">
              <label class="radio-label">
                <input type="radio" v-model="gameSpeed" value="1" />
                <span class="radio-custom"></span>
                <span class="radio-text">x1</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="gameSpeed" value="1.5" />
                <span class="radio-custom"></span>
                <span class="radio-text">x1.5</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="gameSpeed" value="2" />
                <span class="radio-custom"></span>
                <span class="radio-text">x2</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="gameSpeed" value="3" />
                <span class="radio-custom"></span>
                <span class="radio-text">x3</span>
              </label>
            </div>
          </div>
          <button @click="startSinglePlayer" class="retro-btn start-btn">
             <span class="btn-text">START SINGLE PLAYER GAME</span>
          </button>
        </div>
      </transition>
    </div>
    <div class="controls-panel">
      <h3>🎮 CONTROLS</h3>

      <div class="control-row">
        <span class="key">⬅</span>
        <span class="key">➡</span>
        <span class="label">MOVE</span>
      </div>

      <div class="control-row">
        <span class="key">⬆</span>
        <span class="label">ROTATE</span>
      </div>

      <div class="control-row">
        <span class="key">⬇</span>
        <span class="label">SOFT DROP</span>
      </div>

      <div class="control-row">
        <span class="key wide">SPACE</span>
        <span class="label">HARD DROP</span>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, inject  } from 'vue'
import { useRouter } from 'vue-router'


const router = useRouter()
const socket = inject('socket')

const room = ref('')
const player = ref('')
const showOptions = ref(false)
const gameMode = inject('gameMode')
const gameSpeed = inject('gameSpeed')
const scores = ref([])
const noOnlySpacesPattern = '.*\\S.*'



onMounted(() => {
  socket.emit('getLeaderboard')

  socket.on('leaderboardUpdate', (data) => {
    scores.value = data
  })
})

function toggleSinglePlayer() {
  showOptions.value = !showOptions.value
}

function joinGame() {
  const cleanRoom = room.value.replace(/\s+/g, '')
  const cleanPlayer = player.value.replace(/\s+/g, '')
  
  if (!cleanRoom || !cleanPlayer) return

  router.push(`/${cleanRoom}/${cleanPlayer}`)
}

function startSinglePlayer() {
  let cleanPlayer = player.value.replace(/\s+/g, '')

  if (!cleanPlayer) 
  {
    cleanPlayer = "Guest"
  }
  router.push(`/ /${cleanPlayer}`)
}
</script>

<style scoped>
.home {
  position: relative;
  text-align: center;
  margin-top: 3rem;
  padding: 2rem;
  min-height: 100vh;
}

.leaderboard {
  position: fixed;
  top: 4rem;
  left: 4rem;
  width: 250px;
  background: rgba(17, 17, 17, 0.95);
  border: 2px solid #333;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
  z-index: 100;
}

.leaderboard h2 {
  color: #f1c40f;
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  text-align: center;
}

.leaderboard ol {
  padding: 0;
  margin: 0;
  list-style: none;
}

.leaderboard li {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  color: #0f0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9rem;
  border-bottom: 1px solid #222;
}

.leaderboard li:last-child {
  border-bottom: none;
}

.leaderboard .name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 150px;
}

.leaderboard .score {
  color: #ff0040;
  font-weight: bold;
  margin-left: 1rem;
}

.title-box {
  position: relative;
  margin-bottom: 3rem;
}

.neon-title {
  font-size: 4rem;
  font-weight: bold;
  color: #ff0040;
  text-shadow: 
    0 0 10px #ff0040,
    0 0 20px #ff0040,
    0 0 30px #ff0040,
    0 0 40px #ff0040;
  letter-spacing: 0.3rem;
  margin: 0;
  animation: flicker 3s infinite;
}

@keyframes flicker {
  0%, 100% { opacity: 1; }
  41.99% { opacity: 1; }
  42% { opacity: 0.8; }
  43% { opacity: 1; }
  45.99% { opacity: 1; }
  46% { opacity: 0.9; }
  46.5% { opacity: 1; }
}

.scanlines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.15),
    rgba(0, 0, 0, 0.15) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
}

.container {
  max-width: 500px;
  margin: 0 auto;
}

.subtitle {
  color: #aaa;
  font-size: 0.9rem;
  margin-bottom: 2rem;
  text-transform: uppercase;
  letter-spacing: 0.1rem;
}

.game-form {
  margin-bottom: 2rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.retro-input {
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-family: 'JetBrains Mono', monospace;
  background: #1a1a1a;
  border: 2px solid #333;
  color: #0f0;
  text-transform: uppercase;
  transition: all 0.3s;
}

.retro-input:focus {
  outline: none;
  border-color: #ff0040;
  box-shadow: 0 0 10px rgba(255, 0, 64, 0.3);
}

.retro-input::placeholder {
  color: #555;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.retro-btn {
  padding: 1rem 2rem;
  font-size: 1rem;
  font-family: 'JetBrains Mono', monospace;
  font-weight: bold;
  text-transform: uppercase;
  background: #222;
  border: 3px solid;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  letter-spacing: 0.1rem;
}

.retro-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  transition: left 0.3s;
}

.retro-btn:hover::before {
  left: 100%;
}

.single-btn {
  border-color: #0ff;
  color: #0ff;
}

.single-btn:hover {
  background: #0ff;
  color: #000;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
}

.multi-btn {
  border-color: #f0f;
  color: #f0f;
}

.multi-btn:hover {
  background: #f0f;
  color: #000;
  box-shadow: 0 0 20px rgba(255, 0, 255, 0.5);
}

.start-btn {
  width: 100%;
  margin-top: 1.5rem;
  border-color: #ff0040;
  color: #ff0040;
}

.start-btn:hover {
  background: #ff0040;
  color: #fff;
  box-shadow: 0 0 20px rgba(255, 0, 64, 0.5);
}

.btn-text {
  position: relative;
  z-index: 1;
}

.options-panel {
  background: #1a1a1a;
  border: 3px solid #333;
  padding: 1.5rem;
  margin-top: 2rem;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
}

.panel-header {
  color: #0f0;
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 0.2rem;
  border-bottom: 2px solid #333;
  padding-bottom: 0.5rem;
}

.blink {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

.option-section {
  margin-bottom: 1.5rem;
}

.option-label {
  display: block;
  color: #888;
  font-size: 0.8rem;
  font-weight: bold;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.15rem;
}

.radio-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.speed-group {
  gap: 0.5rem;
}

.radio-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
  padding: 0.5rem 1rem;
  background: #111;
  border: 2px solid #333;
  transition: all 0.3s;
}

.radio-label:hover {
  border-color: #555;
  background: #222;
}

.radio-label input[type="radio"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.radio-custom {
  width: 16px;
  height: 16px;
  border: 2px solid #666;
  border-radius: 50%;
  margin-right: 0.5rem;
  position: relative;
  transition: all 0.3s;
}

.radio-custom::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0);
  width: 8px;
  height: 8px;
  background: #0f0;
  border-radius: 50%;
  transition: transform 0.3s;
  box-shadow: 0 0 10px #0f0;
}

.radio-label input[type="radio"]:checked ~ .radio-custom {
  border-color: #0f0;
}

.radio-label input[type="radio"]:checked ~ .radio-custom::after {
  transform: translate(-50%, -50%) scale(1);
}

.radio-label input[type="radio"]:checked ~ .radio-text {
  color: #0f0;
}

.radio-text {
  color: #aaa;
  font-size: 0.9rem;
  font-weight: bold;
  text-transform: uppercase;
  transition: color 0.3s;
}

.slide-enter-active {
  animation: slideDown 0.4s ease-out;
}

.slide-leave-active {
  animation: slideUp 0.3s ease-in;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-20px);
  }
}

@media (max-width: 768px) {
  .leaderboard {
    position: static;
    width: auto;
    max-width: 300px;
    margin: 0 auto 2rem;
  }
}

.controls-panel {
  position: fixed;
  top: 4rem;
  right: 4rem;
  width: 250px;
  padding: 1rem;
  background: rgba(17, 17, 17, 0.95);
  border: 2px solid #333;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
  font-family: 'JetBrains Mono', monospace;
}

.controls-panel h3 {
  margin: 0 0 1rem;
  color: #0ff;
  font-size: 1rem;
  text-align: center;
  letter-spacing: 0.15rem;
}

.control-row {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
  gap: 0.5rem;
}

.key {
  min-width: 32px;
  padding: 0.3rem 0.5rem;
  text-align: center;
  background: #111;
  border: 2px solid #444;
  color: #0f0;
  font-size: 0.9rem;
  border-radius: 4px;
  box-shadow: inset 0 0 5px rgba(0, 255, 0, 0.3);
}

.key.wide {
  min-width: 70px;
  font-size: 0.75rem;
}

.label {
  margin-left: auto;
  color: #aaa;
  font-size: 0.8rem;
  text-transform: uppercase;
}

</style>