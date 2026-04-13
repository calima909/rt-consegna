import Player from './player.js'
import { TETRIMINOS } from './piece.js'

export default class Game {
  constructor(roomName, rows = 20, cols = 10) {
    this.roomName = roomName
    this.TETRIMINOS = TETRIMINOS
    this.ROWS = rows
    this.COLS = cols
    this.players = []
    this.queue = Game.generateBag()
    this.started = false
    this.isRunning = false
    this.isSinglePlayer = false
  }

  static generateBag() {
    const pieces = ["I" ,"J","L", "O", "S", "T", "Z" ]
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pieces[i], pieces[j]] = [pieces[j], pieces[i]]
    }
    return pieces
  }

  ensureQueue(minLength = 3) {
    while (this.queue.length < minLength) {
      this.queue.push(...Game.generateBag())
    }
  }

  resetRoom(roomName, rows = 20, cols = 10)
  {
    this.roomName = roomName
    this.TETRIMINOS = TETRIMINOS
    this.ROWS = rows
    this.COLS = cols
    this.queue = null
    this.queue = Game.generateBag()
  }

  addPlayer(id, name) {
    const isHost = this.players.length === 0
    const p = new Player(id, name, isHost)
    this.players.push(p)
    return p
  }

  removePlayerById(id) {
    const idx = this.players.findIndex(pl => pl.id === id)

    if (idx === -1) return null
    const [removed] = this.players.splice(idx, 1)
    if (removed.isHost && this.players.length > 0) {
      this.players[0].isHost = true
    }
    return removed
  }

  findPlayer(id) {
    return this.players.find(p => p.id === id) || null
  }

  requestNextPieceFor(playerId) {
    const player = this.findPlayer(playerId)
    if (!player) return null

    this.ensureQueue(player.currentIndex + 7)
    const type = this.queue[player.currentIndex]
    player.piecesUsed.push(type)
    
    const spawn = { x: 3, y: 0 }
    const rotationIdx = 0
    
    player.currentIndex++

    return { type, spawn, rotationIdx }
  }

}
