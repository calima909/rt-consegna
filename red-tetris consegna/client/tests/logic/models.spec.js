import { describe, it, expect, beforeEach } from 'vitest'
import Game from '../../../server/models/game.js'
import Player from '../../../server/models/player.js'

describe('Game Model', () => {
  let game

  beforeEach(() => {
    game = new Game('room1')
  })

  it('should initialize correctly', () => {
    expect(game.roomName).toBe('room1')
    expect(game.ROWS).toBe(20)
    expect(game.COLS).toBe(10)
    expect(game.players).toEqual([])
    expect(game.queue.length).toBeGreaterThan(0)
    expect(game.started).toBe(false)
    expect(game.isRunning).toBe(false)
  })

  it('should add a player and assign host correctly', () => {
    const p1 = game.addPlayer('1', 'Alice')
    expect(game.players.length).toBe(1)
    expect(p1.isHost).toBe(true)

    const p2 = game.addPlayer('2', 'Bob')
    expect(game.players.length).toBe(2)
    expect(p2.isHost).toBe(false)
  })

  it('should remove a player and transfer host if needed', () => {
    const p1 = game.addPlayer('1', 'Alice')
    const p2 = game.addPlayer('2', 'Bob')

    const removed = game.removePlayerById('1')
    expect(removed.id).toBe('1')
    expect(game.players.length).toBe(1)
    expect(game.players[0].isHost).toBe(true)
  })

  it('findPlayer returns the correct player or null', () => {
    game.addPlayer('1', 'Alice')
    expect(game.findPlayer('1').name).toBe('Alice')
    expect(game.findPlayer('999')).toBeNull()
  })

  it('requestNextPieceFor returns next piece and updates player index', () => {
    const player = game.addPlayer('1', 'Alice')
    const result = game.requestNextPieceFor('1')
    expect(result.type).toBe(game.queue[0])
    expect(result.spawn).toEqual({ x: 3, y: 0 })
    expect(result.rotationIdx).toBe(0)
    expect(player.currentIndex).toBe(1)
    expect(player.piecesUsed).toContain(result.type)
  })

  it('ensureQueue adds pieces if below minLength', () => {
    game.queue = ['I']
    game.ensureQueue(5)
    expect(game.queue.length).toBeGreaterThanOrEqual(5)
  })

  it('resetRoom resets queue and roomName', () => {
    game.addPlayer('1', 'Alice')
    const oldQueue = [...game.queue]
    game.resetRoom('newRoom')
    expect(game.roomName).toBe('newRoom')
    expect(game.queue).not.toEqual(oldQueue)
  })

  it('generateBag returns all 7 types', () => {
    const bag = Game.generateBag()
    const types = ['I','J','L','O','S','T','Z']
    for (const t of types) {
      expect(bag).toContain(t)
    }
  })
})

describe('Player Model', () => {
  it('should create empty grid correctly', () => {
    const grid = Player.createEmptyGrid()
    expect(grid.length).toBe(20)
    expect(grid[0].length).toBe(10)
    expect(grid.every(row => row.every(cell => cell === 0))).toBe(true)
  })

  it('calcSpectrum calculates column heights correctly', () => {
    const p = new Player('1','Alice')
    const grid = Player.createEmptyGrid()
    grid[19][0] = 1
    grid[18][0] = 1
    grid[19][1] = 1
    const spectrum = p.calcSpectrum(grid)
    expect(spectrum[0]).toBe(20 - 18) 
    expect(spectrum[1]).toBe(1)
    expect(spectrum.slice(2).every(h => h === 0)).toBe(true)
  })
})