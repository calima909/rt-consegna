<template>
  <div class="game">

    <div v-if="!gameStarted && !SinglePlayerMod" class="lobby">
      <h3>🕹️ Lobby in attesa...</h3>
      <ul>
        <li v-for="p in players" :key="p.id">
          {{ p.name }}
          <span v-if="p.isHost">⭐ (Host)</span>
        </li>
      </ul>

      <p v-if="isHost">Premi Start per avviare la partita!</p>
      <button v-if="isHost" @click="startGame" class="startGameBtn">Start Game</button>
      <p v-else>In attesa che l'host inizi la partita...</p>
      <p>
        <button @click="goToHome">Torna alla home</button>
      </p>
    </div>
    
    <div v-else class="playfield">
      <div class="game-container">

        <div v-if="!SinglePlayerMod" class="spectra-container">
          <Spectrum 
            v-for="p in otherPlayers" 
            :key="p.id" 
            :playerName="p.name" 
            :spectrum="p.spectrum || Array(10).fill(0)"
          />
        </div>

        <div class="grid-wrapper">
          <div class="grid-overlay">
            <h2>ROOM: {{ room }}</h2>
            <p>PLAYER: {{ player }}</p>
          </div>
          
          <div class="grid">
            <div v-for="(row, y) in grid" :key="y" class="row">
              <div
                v-for="(cell, x) in row"
                :key="x"
                class="cell"
                :style="{ background: cell ? COLORS[cell] : '#111' }"
              ></div>
            </div>
          </div>
        </div>

        <div class="score-panel">
          <img :src="scoreImg" alt="Score" class="score-icon">
          <h3>SCORE</h3>
          <p class="score-value">{{ score }}</p>
          
          <div v-if="SinglePlayerMod && gameMode === 'stage'" class="stage-info">
            <div class="stage-label">STAGE {{ currentStage }}</div>
            <div class="target-score">TARGET: {{ stageTarget }}</div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: stageProgress + '%' }"></div>
            </div>
          </div>

          <div v-if="SinglePlayerMod" class="mode-badges">
            <div class="badge mode-badge">{{ CustomToUpper(gameMode) }}</div>
            <div class="badge speed-badge">x{{ gameSpeed }}</div> 
          </div>
        </div>

      </div>
    </div>
    
    <div v-if="endGameMessage" class="end-game-overlay">
      <h2 v-if="endGameMessage === 'victory'">🏆 Hai vinto!</h2>
      <h2 v-else-if="endGameMessage === 'defeat'">💀 Game Over</h2>
      <h2 v-else-if="endGameMessage === 'stage_complete'">
        🎉 Stage {{ currentStage }} Completato!
      </h2>

      <p v-if="endGameMessage === 'stage_complete'" class="stage-message">
        Prossimo obiettivo: {{ stageTarget * 2 }} punti
      </p>

      <p v-if="endGameMessage === 'victory'" class="final-score">
        SCORE FINALE: {{ finalScore }}
      </p>

      <p v-if="endGameMessage === 'defeat'" class="final-score">
        SCORE FINALE: {{ finalScore }}
      </p>

      <button
        v-if="SinglePlayerMod && endGameMessage === 'stage_complete'"
        @click="nextStage"
      >
        Prossimo Stage
      </button>

      <button v-else-if="SinglePlayerMod" @click="goToHome">
        Torna alla home
      </button>

      <button v-else @click="goToLobby">
        Torna alla lobby
      </button>
    </div>

  </div>
</template>

<script setup>
import scoreImg from '../assets/score.png'
import { inject, ref, onMounted, onUnmounted, onBeforeUnmount, computed, watch } from 'vue'
import { useRoute, onBeforeRouteLeave } from 'vue-router'
import {
  createGrid,
  TETRIMINOS,
  mergePiece,
  hasCollision,
  clearLines,
  applyGarbage
} from '../logic/tetris.js'
import { COLORS } from '../logic/tetris.js'
import Spectrum from './Spectrum.vue'

const gameMode = inject('gameMode')
const gameSpeed = inject('gameSpeed')
const socket = inject('socket')
const route = useRoute()
const room = route.params.room
const player = route.params.player
const players = ref([])
const isHost = ref(false)
const gameStarted = ref(false)
const baseGrid = ref(createGrid())
const currentPiece = ref(null)
let intervalId = null
const myId = ref(null)
const endGameMessage = ref(null)
const score = ref(0)
const finalScore = ref(0) 
const SinglePlayerMod = room === ' '

const currentStage = ref(1)
const stageTarget = ref(1000)
const BASE_SPEED = 500

let isBugging = false
let pendingPenalty = 0
let piece_height = 0
let pendingPenaltyTotal = 0


function drawPiece(grid, piece) {
  const newGrid = grid.map(r => [...r])
  if (
    !piece ||
    !piece.shape ||
    !piece.position
  ) {
    return newGrid
  }

  const { x, y } = piece.position

  piece.shape.forEach((row, dy) => {
    row.forEach((cell, dx) => {
      if (cell !== 0) {
        newGrid[y + dy][x + dx] = piece.type
      }
    })
  })
  return newGrid
}


const grid = computed(() => {
  if (!currentPiece.value) return baseGrid.value
  piece_height = currentPiece.value.position.y
  if (check_grid(baseGrid.value))
  {
    baseGrid.value = applyGarbage(baseGrid.value, pendingPenalty)
    pendingPenalty = 0
  }
  else
  {
    isBugging = false
  }
  return drawPiece(baseGrid.value, currentPiece.value)
})

const myMaxYValue = computed(() => {
  const me = players.value.find(p => p.id === myId.value)
  return me?.maxy || 0  
})

const otherPlayers = computed(() => {
  if (SinglePlayerMod) return []
  if (!myId.value) return []
  return players.value.filter(p => p.id !== myId.value)
})

const stageProgress = computed(() => {
  if (gameMode.value !== 'stage') return 0
  return Math.min((score.value / stageTarget.value) * 100, 100)
})

watch(score, (newScore) => {
  if (gameMode.value === 'stage' && newScore >= stageTarget.value && gameStarted.value && SinglePlayerMod) {
    completeStage()
  }
})

function completeStage() {
  gameStarted.value = false
  endGameMessage.value = 'stage_complete'
  clearInterval(intervalId)
  intervalId = null
}

function CustomToUpper(str) {
  let newString = "";

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);

    if (code >= 97 && code <= 122) {
      newString += String.fromCharCode(code - 32);
    } else {
      newString += str[i];
    }
  }

  return newString;
}


function nextStage() {
  currentStage.value++
  stageTarget.value = 1000 * currentStage.value
  endGameMessage.value = null
  
  baseGrid.value = createGrid()
  currentPiece.value = null
  score.value = 0
  
  gameStarted.value = true
  
  socket.emit('requestNextPiece', room)
  socket.emit('spectrumReset', { room })
  
  const speed = BASE_SPEED / gameSpeed.value
  intervalId = setInterval(() => {
    if (currentPiece.value && gameStarted.value) {
      movePiece(0, 1)
    }
  }, speed)
}

onMounted(() => {
  socket.emit('joinRoom', { room, player })
  if (SinglePlayerMod) {
    isHost.value = true
    gameStarted.value = true

    socket.emit('requestNextPiece', room)
    socket.emit('spectrumReset', { room })
    
    const speed = BASE_SPEED / gameSpeed.value
    intervalId = setInterval(() => {
      if (currentPiece.value && gameStarted.value) {
        movePiece(0, 1)
      }
    }, speed)
  }
  
  socket.on('lobbyUpdate', (newPlayers) => {
    players.value = newPlayers
    const me = newPlayers.find(p => p.id === myId.value)
    isHost.value = me?.isHost || false
  })

  socket.on('roomFull', (msg) => {
    console.log(msg)
    window.location.href = '/'
  })

  socket.on('gameStarted', () => {
    baseGrid.value = createGrid() 
    gameStarted.value = true

    socket.emit('spectrumReset', { room })
 
    socket.emit('requestNextPiece', room)
    socket.emit('spectrumUpdate', { room, grid: baseGrid.value })

    intervalId = setInterval(() => {
      if (currentPiece.value && gameStarted.value) {
        movePiece(0, 1)
      }
    }, BASE_SPEED)
  })

  socket.on('nextPiece', (type) => {
    spawnPiece(type)
  })

  socket.on('returnToLobby', () => {
    baseGrid.value = createGrid()
    currentPiece.value = null

    clearInterval(intervalId)
    intervalId = null
  })

  socket.on('endGameMessage', (msg) => {
    endGameMessage.value = msg
    if (msg === 'defeat' || msg === 'victory') {
      finalScore.value = score.value
    
      submitFinalScore()
    }
  })

  socket.on('autoGameOver', () => {
    if (SinglePlayerMod) return
    socket.emit('gameOver', {
      room,
      playerId: myId.value
    })
    socket.emit('spectrumUpdate', {
      room,
      grid: baseGrid.value
    })
  })

  socket.on('spectrumUpdate', ({ spectra }) => {
    players.value = players.value.map(p => {
      const found = spectra.find(s => s.id === p.id)
      return found
        ? { ...p, spectrum: found.spectrum, maxy: found.maxy }
        : p
    })
  })
  
  socket.on('receivePenalty', ({ penalty }) => {
    if (!penalty || penalty <= 0) return

    pendingPenalty += penalty
    pendingPenaltyTotal += pendingPenalty
  })

  
  socket.on('playerInfo', (data) => {
    myId.value = data.id
    isHost.value = data.isHost
  })
  
  window.addEventListener('keydown', handleKey)
})

function goToLobby() {
  endGameMessage.value = null
  currentPiece.value = null
  gameStarted.value = false
  score.value = 0
  socket.emit('areAllReady', room)
}

function startGame() {
  socket.emit('startGame', room)
}

function spawnPiece(type) {
  currentPiece.value = {
    type,
    shape: TETRIMINOS[type][0],
    position: { x: 3, y: 0 },
    rotation: 0
  }

  if (hasCollision(baseGrid.value, currentPiece.value, currentPiece.value.position)) {
    if (SinglePlayerMod) {
      finalScore.value = score.value
      endGameMessage.value = 'defeat'
      gameStarted.value = false
      currentPiece.value = null
      clearInterval(intervalId)
      intervalId = null
      return
    }

    socket.emit('gameOver', { room, playerId: myId.value })
    socket.emit('spectrumUpdate', {
      room,
      grid: baseGrid.value
    })
  }
}

function movePiece(dx, dy) {
  const newPos = { 
    x: currentPiece.value.position.x + dx, 
    y: currentPiece.value.position.y + dy 
  }

  if (!hasCollision(baseGrid.value, currentPiece.value, newPos)) {
    currentPiece.value.position = newPos
    return
  }

  if (dy > 0) {
    
    baseGrid.value = mergePiece(baseGrid.value, currentPiece.value, currentPiece.value.position)  
    const cleared = clearLines(baseGrid.value)
    baseGrid.value = cleared.newGrid
    if (cleared.linesCleared > 0) {addScore(cleared.linesCleared)}
    if (pendingPenalty > 0 && !isBugging) {
      baseGrid.value = applyGarbage(baseGrid.value, pendingPenalty)
      pendingPenalty = 0
    }
    socket.emit('sendPenalty', {room, lines: cleared.linesCleared})
    socket.emit('requestNextPiece', room)
    socket.emit('spectrumUpdate', {room, grid: baseGrid.value})
    isBugging = true
  }
}

 
const rotatePiece = () => {
  const type = currentPiece.value.type
  const nextRotation = (currentPiece.value.rotation + 1) % TETRIMINOS[type].length
  const newShape = TETRIMINOS[type][nextRotation]
  const newPiece = { ...currentPiece.value, shape: newShape, rotation: nextRotation }
  if (!hasCollision(baseGrid.value, newPiece, newPiece.position)) {
    currentPiece.value = newPiece
  }
}

function goToHome() {
  window.location.href = '/'
}

function check_grid(grid)
{
  let curr_piece_value = currentPiece.value
  let curr_piece_height = 1

  if (curr_piece_value.type === 'O')
  {
    curr_piece_height = 2 
  }
  else if (curr_piece_value.type === 'I')
  {
    if (curr_piece_value.rotation % 2 !== 0)
      curr_piece_height = 4
  }
  else
  {
      if (curr_piece_value.rotation % 2 !== 0)
        curr_piece_height = 3
      else
      if (curr_piece_value.type === 'I')
          curr_piece_height = 1
      else
        curr_piece_height = 2
  }
  const value = curr_piece_height + piece_height;
  if (value < (20 - pendingPenaltyTotal - 1) && value < (20 - myMaxYValue.value - 1))
  {
    return true;
  }
  else
    return false;

}

function handleKey(e) {
  if (!gameStarted.value) return
  if (!currentPiece.value) return

  const keysToPrevent = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ']
  if (keysToPrevent.includes(e.key)) {
    e.preventDefault() 
  }

  switch (e.key) {
    case 'ArrowLeft': movePiece(-1, 0); break
    case 'ArrowRight': movePiece(1, 0); break
    case 'ArrowDown': movePiece(0, 1); break
    case 'ArrowUp': rotatePiece(); break
    case ' ':
      while (!hasCollision(baseGrid.value, currentPiece.value, { 
        x: currentPiece.value.position.x, 
        y: currentPiece.value.position.y + 1 
      })) {
        currentPiece.value.position.y += 1
      }
      movePiece(0, 1)
      break
  }
}

onBeforeRouteLeave(() => {
  socket.emit('resetRooms');
  socket.emit('leaveRoom', { room })
})

onBeforeUnmount(() => {
  socket.off('lobbyUpdate')
  socket.off('roomFull')
  socket.off('gameStarted')
  socket.off('nextPiece')
  socket.off('returnToLobby')
  socket.off('endGameMessage')
  socket.off('autoGameOver')
  socket.off('spectrumUpdate')
  socket.off('receivePenalty')
  socket.off('playerInfo')

  window.removeEventListener('keydown', handleKey)

  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
})


const handleTabClose = (event) => {
  socket.emit('leaveRoom', { room })
  event.preventDefault()
  event.returnValue = ''
}

window.addEventListener('unload', handleTabClose)

onUnmounted(() => {
  window.removeEventListener('keydown', handleKey)
  window.removeEventListener('unload', handleTabClose)
  clearInterval(intervalId)
})

function addScore(linesCleared) {
  const table = {
    1: 100,
    2: 300,
    3: 500,
    4: 800
  }

  score.value += table[linesCleared] || 0
}

function submitFinalScore() {
  if (finalScore.value > 0)
    {
    socket.emit('submitScore', {
      player: player,
      score: finalScore.value 
    })
  }  
}

</script>

<style scoped>
.game {
  text-align: center;
  margin-top: 2rem;
  caret-color: transparent;
}

.lobby {
  background: #111;
  padding: 1.5rem;
  border-radius: 10px;
  width: 300px;
  margin: 2rem auto;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  margin: 0.25rem 0;
  color: #eee;
}

button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.startGameBtn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #1caa00;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.grid-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.grid-overlay {
  text-align: center;
  color: #fff;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.grid-overlay h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #0ff;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}

.grid-overlay p {
  margin: 0.25rem 0 0 0;
  font-size: 1rem;
  color: #f1c40f;
}

.grid {
  display: grid;
  grid-template-rows: repeat(20, 24px);
  grid-template-columns: repeat(10, 24px);
  gap: 1px;
  background: #222;
  width: fit-content;
}

.row {
  display: contents;
}

.cell {
  width: 24px;
  height: 24px;
  background: #111;
  border: 1px solid #222;
  box-shadow: inset -2px -2px 5px rgba(255,255,255,0.2),
              inset 2px 2px 5px rgba(0,0,0,0.7);
  transition: background 0.1s;
}

.end-game-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  z-index: 1000;
}

.end-game-overlay h2 {
  font-size: 3rem;
  margin-bottom: 1rem;
  text-shadow: 0 0 20px currentColor;
}

.stage-message {
  font-size: 1.2rem;
  color: #0f0;
  margin-bottom: 1rem;
}

.final-score {
  font-size: 1.5rem;
  color: #f1c40f;
  font-weight: bold;
  margin-bottom: 1rem;
}

.end-game-overlay button {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #e74c3c;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.1rem;
}

.spectra-container {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 1rem;
}

.score-panel {
  padding: 1rem;
  background: #111;
  border-radius: 10px;
  width: 180px;
  box-shadow: 0 0 10px rgba(0,0,0,0.6);
}

.score-panel h3 {
  margin: 0.5rem 0;
  color: #f1c40f;
  font-size: 1rem;
}

.score-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #fff;
  margin: 0.5rem 0;
}

.score-icon {
  width: 32px;
  height: auto;
}

.game-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 2rem;
  margin-top: 2rem;
}

.stage-info {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 2px solid #333;
}

.stage-label {
  color: #0ff;
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.target-score {
  color: #888;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #222;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #444;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #0f0, #0ff);
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}

.mode-badges {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.badge {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: bold;
  border-radius: 4px;
}

.mode-badge {
  background: #0f0;
  color: #000;
}

.speed-badge {
  background: #f0f;
  color: #000;
}

html, body {
  overflow: hidden; 
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>