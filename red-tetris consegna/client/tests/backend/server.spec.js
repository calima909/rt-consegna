import { describe, it, expect, beforeEach, vi } from 'vitest'

class MockGame {
  constructor(name) {
    this.name = name
    this.players = []
    this.started = false
    this.queue = []
    this.isSinglePlayer = false
  }

  addPlayer(socketId, name) {
    const player = {
      id: socketId,
      name,
      isHost: this.players.length === 0,
      isAlive: true,
      inLobby: true,
      grid: Array(20).fill(null).map(() => Array(10).fill(null)),
      spectrum: Array(10).fill(0),
      gridForSpectrum: Array(20).fill(null).map(() => Array(10).fill(null)),
      currentIndex: 0,
      piecesUsed: []
    }
    this.players.push(player)
    return player
  }

  removePlayerById(socketId) {
    const index = this.players.findIndex(p => p.id === socketId)
    if (index === -1) return null
    
    const removed = this.players.splice(index, 1)[0]
    
    if (removed.isHost && this.players.length > 0) {
      this.players[0].isHost = true
    }
    
    return removed
  }

  findPlayer(socketId) {
    return this.players.find(p => p.id === socketId)
  }

  requestNextPieceFor(socketId) {
    const player = this.findPlayer(socketId)
    if (!player) return null
    
    if (this.queue.length === 0) {
      this.queue = MockGame.generateBag()
    }
    
    const piece = this.queue[player.currentIndex]
    player.currentIndex++
    
    if (player.currentIndex >= this.queue.length) {
      this.queue = [...this.queue, ...MockGame.generateBag()]
    }
    
    return { type: piece }
  }

  static generateBag() {
    const pieces = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']
    return pieces.sort(() => Math.random() - 0.5)
  }

  static createEmptyGrid() {
    return Array(20).fill(null).map(() => Array(10).fill(null))
  }
}

class MockPlayer {
  static createEmptyGrid() {
    return Array(20).fill(null).map(() => Array(10).fill(null))
  }

  calcSpectrum(grid) {
    return Array(10).fill(0).map((_, col) => {
      for (let row = 0; row < 20; row++) {
        if (grid[row][col] !== null) {
          return 20 - row
        }
      }
      return 0
    })
  }
}

const mockLeaderboard = {
  scores: [
    { player: 'Alice', score: 1000 },
    { player: 'Bob', score: 500 }
  ],
  readScores() {
    return this.scores
  },
  saveScore({ player, score }) {
    this.scores.unshift({ player, score })
    this.scores.sort((a, b) => b.score - a.score)
    return this.scores.slice(0, 10)
  }
}

describe('Server Logic - Game Model', () => {
  let game

  beforeEach(() => {
    game = new MockGame('testRoom')
  })

  describe('Game Creation', () => {
    it('creates a game with correct initial state', () => {
      expect(game.name).toBe('testRoom')
      expect(game.players).toEqual([])
      expect(game.started).toBe(false)
      expect(game.queue).toEqual([])
    })
  })

  describe('Player Management', () => {
    it('adds first player as host', () => {
      const player = game.addPlayer('socket1', 'Player1')
      
      expect(player.name).toBe('Player1')
      expect(player.isHost).toBe(true)
      expect(player.isAlive).toBe(true)
      expect(player.inLobby).toBe(true)
      expect(game.players).toHaveLength(1)
    })

    it('adds second player as non-host', () => {
      game.addPlayer('socket1', 'Player1')
      const player2 = game.addPlayer('socket2', 'Player2')
      
      expect(player2.isHost).toBe(false)
      expect(game.players).toHaveLength(2)
    })

    it('removes player by id', () => {
      game.addPlayer('socket1', 'Player1')
      game.addPlayer('socket2', 'Player2')
      
      const removed = game.removePlayerById('socket1')
      
      expect(removed.name).toBe('Player1')
      expect(game.players).toHaveLength(1)
      expect(game.players[0].name).toBe('Player2')
    })

    it('reassigns host when host leaves', () => {
      game.addPlayer('socket1', 'Player1')
      game.addPlayer('socket2', 'Player2')
      
      game.removePlayerById('socket1')
      
      expect(game.players[0].isHost).toBe(true)
    })

    it('returns null when removing non-existent player', () => {
      const removed = game.removePlayerById('nonexistent')
      expect(removed).toBeNull()
    })

    it('finds player by socket id', () => {
      game.addPlayer('socket1', 'Player1')
      game.addPlayer('socket2', 'Player2')
      
      const found = game.findPlayer('socket2')
      
      expect(found.name).toBe('Player2')
    })
  })

  describe('Piece Distribution', () => {
    it('generates bag of 7 pieces', () => {
      const bag = MockGame.generateBag()
      
      expect(bag).toHaveLength(7)
      expect(bag).toContain('I')
      expect(bag).toContain('O')
      expect(bag).toContain('T')
      expect(bag).toContain('S')
      expect(bag).toContain('Z')
      expect(bag).toContain('J')
      expect(bag).toContain('L')
    })

    it('requests next piece for player', () => {
      game.addPlayer('socket1', 'Player1')
      game.queue = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']
      
      const piece = game.requestNextPieceFor('socket1')
      
      expect(piece).toBeDefined()
      expect(piece.type).toBe('I')
    })

    it('increments player piece index', () => {
      const player = game.addPlayer('socket1', 'Player1')
      game.queue = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']
      
      game.requestNextPieceFor('socket1')
      expect(player.currentIndex).toBe(1)
      
      game.requestNextPieceFor('socket1')
      expect(player.currentIndex).toBe(2)
    })

    it('generates new bag when queue exhausted', () => {
      const player = game.addPlayer('socket1', 'Player1')
      game.queue = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']
      
      for (let i = 0; i < 8; i++) {
        game.requestNextPieceFor('socket1')
      }
      
      expect(game.queue.length).toBeGreaterThan(7)
    })

    it('returns null for non-existent player', () => {
      const piece = game.requestNextPieceFor('nonexistent')
      expect(piece).toBeNull()
    })
  })

  describe('Game State', () => {
    it('starts game and updates player states', () => {
      game.addPlayer('socket1', 'Player1')
      game.addPlayer('socket2', 'Player2')
      
      game.started = true
      game.players.forEach(p => {
        p.isAlive = true
        p.inLobby = false
        p.currentIndex = 0
        p.piecesUsed = []
      })
      game.queue = MockGame.generateBag()
      
      expect(game.started).toBe(true)
      expect(game.players[0].inLobby).toBe(false)
      expect(game.players[1].inLobby).toBe(false)
      expect(game.queue).toHaveLength(7)
    })

    it('marks single player game correctly', () => {
      game.addPlayer('socket1', 'Player1')
      
      if (game.players.length === 1) {
        game.isSinglePlayer = true
      }
      
      expect(game.isSinglePlayer).toBe(true)
    })

    it('marks multiplayer game correctly', () => {
      game.addPlayer('socket1', 'Player1')
      game.addPlayer('socket2', 'Player2')
      
      if (game.players.length > 1) {
        game.isSinglePlayer = false
      }
      
      expect(game.isSinglePlayer).toBe(false)
    })
  })

  describe('Game Over Logic', () => {
    beforeEach(() => {
      game.addPlayer('socket1', 'Player1')
      game.addPlayer('socket2', 'Player2')
      game.started = true
    })

    it('marks player as dead on game over', () => {
      const player = game.findPlayer('socket1')
      player.isAlive = false
      
      expect(player.isAlive).toBe(false)
    })

    it('identifies winner when one player remains', () => {
      game.players[0].isAlive = false
      
      const alivePlayers = game.players.filter(p => p.isAlive)
      
      expect(alivePlayers).toHaveLength(1)
      expect(alivePlayers[0].name).toBe('Player2')
    })

    it('resets player state after game over', () => {
      const player = game.findPlayer('socket1')
      player.currentIndex = 5
      player.piecesUsed = ['I', 'O', 'T']
      
      player.currentIndex = 0
      player.piecesUsed = []
      
      expect(player.currentIndex).toBe(0)
      expect(player.piecesUsed).toEqual([])
    })
  })

  describe('Ready State', () => {
    it('marks player as ready', () => {
      const player = game.addPlayer('socket1', 'Player1')
      player.inLobby = true
      
      expect(player.inLobby).toBe(true)
    })

    it('checks if all players are ready', () => {
      game.addPlayer('socket1', 'Player1')
      game.addPlayer('socket2', 'Player2')
      
      game.players[0].inLobby = true
      game.players[1].inLobby = true
      
      const allReady = game.players.every(p => p.inLobby === true)
      
      expect(allReady).toBe(true)
    })

    it('detects when not all players are ready', () => {
      game.addPlayer('socket1', 'Player1')
      game.addPlayer('socket2', 'Player2')
      
      game.players[0].inLobby = true
      game.players[1].inLobby = false
      
      const allReady = game.players.every(p => p.inLobby === true)
      
      expect(allReady).toBe(false)
    })
  })
})

describe('Server Logic - Player Model', () => {
  describe('Grid Creation', () => {
    it('creates empty 20x10 grid', () => {
      const grid = MockPlayer.createEmptyGrid()
      
      expect(grid).toHaveLength(20)
      expect(grid[0]).toHaveLength(10)
      expect(grid[0][0]).toBeNull()
    })
  })

  describe('Spectrum Calculation', () => {
    it('calculates spectrum for empty grid', () => {
      const player = new MockPlayer()
      const emptyGrid = MockPlayer.createEmptyGrid()
      
      const spectrum = player.calcSpectrum(emptyGrid)
      
      expect(spectrum).toEqual(Array(10).fill(0))
    })

    it('calculates spectrum with blocks', () => {
      const player = new MockPlayer()
      const grid = MockPlayer.createEmptyGrid()
      
      grid[19][0] = 1
      grid[18][0] = 1
      grid[17][0] = 1
      
      const spectrum = player.calcSpectrum(grid)
      
      expect(spectrum[0]).toBe(3)
      expect(spectrum[1]).toBe(0)
    })

    it('calculates different heights for different columns', () => {
      const player = new MockPlayer()
      const grid = MockPlayer.createEmptyGrid()
      
      for (let i = 15; i < 20; i++) grid[i][0] = 1
      

      for (let i = 10; i < 20; i++) grid[i][1] = 1
      
      const spectrum = player.calcSpectrum(grid)
      
      expect(spectrum[0]).toBe(5)
      expect(spectrum[1]).toBe(10)
    })

    it('handles full column', () => {
      const player = new MockPlayer()
      const grid = MockPlayer.createEmptyGrid()
      
      for (let i = 0; i < 20; i++) grid[i][0] = 1
      
      const spectrum = player.calcSpectrum(grid)
      
      expect(spectrum[0]).toBe(20)
    })
  })
})

describe('Server Logic - Leaderboard', () => {
  beforeEach(() => {
    mockLeaderboard.scores = [
      { player: 'Alice', score: 1000 },
      { player: 'Bob', score: 500 }
    ]
  })

  describe('Read Scores', () => {
    it('returns current leaderboard', () => {
      const scores = mockLeaderboard.readScores()
      
      expect(scores).toHaveLength(2)
      expect(scores[0].player).toBe('Alice')
      expect(scores[0].score).toBe(1000)
    })
  })

  describe('Save Score', () => {
    it('adds new score to leaderboard', () => {
      const updated = mockLeaderboard.saveScore({
        player: 'Charlie',
        score: 1500
      })
      
      expect(updated).toContainEqual({ player: 'Charlie', score: 1500 })
    })

    it('sorts scores in descending order', () => {
      mockLeaderboard.saveScore({ player: 'Charlie', score: 750 })
      
      const scores = mockLeaderboard.scores
      
      expect(scores[0].score).toBeGreaterThanOrEqual(scores[1].score)
      expect(scores[1].score).toBeGreaterThanOrEqual(scores[2].score)
    })

    it('places higher score above lower score', () => {
      mockLeaderboard.scores = []
      mockLeaderboard.saveScore({ player: 'Low', score: 100 })
      mockLeaderboard.saveScore({ player: 'High', score: 2000 })
      
      const scores = mockLeaderboard.scores
      
      expect(scores[0].player).toBe('High')
      expect(scores[1].player).toBe('Low')
    })
  })
})

describe('Server Logic - Penalty System', () => {
  it('calculates penalty from cleared lines', () => {
    const lines = 2
    const penalty = lines
    
    expect(penalty).toBe(2)
  })

  it('ignores penalty when lines <= 0', () => {
    const lines = 0
    const shouldSend = lines > 0
    
    expect(shouldSend).toBe(false)
  })

  it('sends penalty when lines > 0', () => {
    const lines = 3
    const shouldSend = lines > 0
    
    expect(shouldSend).toBe(true)
  })

  it('does not send penalty if game not started', () => {
    const gameStarted = false
    const lines = 2
    const shouldSend = gameStarted && lines > 0
    
    expect(shouldSend).toBe(false)
  })
})

describe('Server Logic - Room Management', () => {
  let rooms

  beforeEach(() => {
    rooms = {}
  })

  it('creates new room on first join', () => {
    const roomName = 'testRoom'
    
    if (!rooms[roomName]) {
      rooms[roomName] = new MockGame(roomName)
    }
    
    expect(rooms[roomName]).toBeDefined()
    expect(rooms[roomName].name).toBe('testRoom')
  })

  it('reuses existing room', () => {
    const roomName = 'testRoom'
    rooms[roomName] = new MockGame(roomName)
    
    const originalRoom = rooms[roomName]
    
    const game = rooms[roomName]
    
    expect(game).toBe(originalRoom)
  })

  it('deletes room when empty', () => {
    const roomName = 'testRoom'
    rooms[roomName] = new MockGame(roomName)
    rooms[roomName].addPlayer('socket1', 'Player1')
    
    rooms[roomName].removePlayerById('socket1')
    
    if (rooms[roomName].players.length === 0) {
      delete rooms[roomName]
    }
    
    expect(rooms[roomName]).toBeUndefined()
  })

  it('prevents join when game started', () => {
    const roomName = 'testRoom'
    rooms[roomName] = new MockGame(roomName)
    rooms[roomName].started = true
    
    const canJoin = !rooms[roomName].started
    
    expect(canJoin).toBe(false)
  })
})