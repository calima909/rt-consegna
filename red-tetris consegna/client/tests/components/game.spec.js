import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { nextTick } from 'vue'
import Game from '../../../client/src/components/Game.vue'

const mockRouter = {
  push: vi.fn()
}

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
  useRoute: () => ({
    params: {
      room: 'TestRoom',
      player: 'TestPlayer'
    }
  }),
  onBeforeRouteLeave: vi.fn()
}))

const mockSocket = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn()
}

vi.mock('../../../client/src/logic/tetris.js', () => ({
  createGrid: vi.fn(() => Array(20).fill(null).map(() => Array(10).fill(null))),
  TETRIMINOS: {
    I: [[
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]],
    O: [[
      [1, 1],
      [1, 1]
    ]],
    T: [[
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ]],
    S: [[
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ]],
    Z: [[
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ]],
    J: [[
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ]],
    L: [[
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ]]
  },
  mergePiece: vi.fn((grid, piece, pos) => grid),
  hasCollision: vi.fn(() => false),
  clearLines: vi.fn((grid) => ({ newGrid: grid, linesCleared: 0 })),
  applyGarbage: vi.fn((grid, lines) => grid),
  COLORS: {
    I: '#5a0000',
    O: '#7a0000',
    T: '#9a0000',
    S: '#ba0000',
    Z: '#da0000',
    J: '#f00000',
    L: '#ff3a3a',
    P: '#ff7a7a'
  }
}))

describe('Game Component', () => {
  let wrapper
  let keydownHandler

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    keydownHandler = null
    
    const originalAddEventListener = window.addEventListener
    window.addEventListener = vi.fn((event, handler) => {
      if (event === 'keydown') {
        keydownHandler = handler
      }
      return originalAddEventListener.call(window, event, handler)
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  const createWrapper = () => {
    return mount(Game, {
      global: {
        provide: {
          socket: mockSocket,
          gameMode: { value: 'survival' },
          gameSpeed: { value: '1' }
        }
      }
    })
  }

  describe('Component Initialization', () => {
    it('shows lobby by default in multiplayer mode', async () => {
      wrapper = createWrapper()
      await nextTick()
      
      expect(wrapper.find('.lobby').exists()).toBe(true)
      expect(wrapper.find('.lobby h3').text()).toContain('Lobby in attesa')
    })

    it('emits joinRoom event on mount', () => {
      wrapper = createWrapper()
      
      expect(mockSocket.emit).toHaveBeenCalledWith('joinRoom', {
        room: 'TestRoom',
        player: 'TestPlayer'
      })
    })

    it('registers all socket event listeners on mount', () => {
      wrapper = createWrapper()
      
      const expectedEvents = [
        'lobbyUpdate',
        'roomFull',
        'gameStarted',
        'nextPiece',
        'returnToLobby',
        'endGameMessage',
        'autoGameOver',
        'spectrumUpdate',
        'receivePenalty',
        'playerInfo'
      ]

      expectedEvents.forEach(event => {
        expect(mockSocket.on).toHaveBeenCalledWith(event, expect.any(Function))
      })
    })

    it('registers keyboard event listener on mount', () => {
      wrapper = createWrapper()
      expect(window.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
    })
  })

  describe('Lobby Management', () => {
    it('displays players list in lobby', async () => {
      wrapper = createWrapper()
      
      const callback = mockSocket.on.mock.calls.find(
        call => call[0] === 'lobbyUpdate'
      )[1]

      const players = [
        { id: '1', name: 'Player1', isHost: true },
        { id: '2', name: 'Player2', isHost: false }
      ]

      callback(players)
      await nextTick()

      const playerItems = wrapper.findAll('.lobby li')
      expect(playerItems).toHaveLength(2)
      expect(playerItems[0].text()).toContain('Player1')
      expect(playerItems[0].text()).toContain('⭐ (Host)')
      expect(playerItems[1].text()).toContain('Player2')
    })

    it('shows start button only for host', async () => {
      wrapper = createWrapper()
      
      const playerInfoCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'playerInfo'
      )[1]
      playerInfoCallback({ id: '1', isHost: true })
      await nextTick()

      expect(wrapper.find('.startGameBtn').exists()).toBe(true)
      expect(wrapper.find('.startGameBtn').text()).toBe('Start Game')
    })

    it('shows waiting message for non-host players', async () => {
      wrapper = createWrapper()
      
      const playerInfoCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'playerInfo'
      )[1]
      playerInfoCallback({ id: '2', isHost: false })
      await nextTick()

      expect(wrapper.text()).toContain('In attesa che l\'host inizi la partita')
      expect(wrapper.find('.startGameBtn').exists()).toBe(false)
    })

    it('emits startGame when host clicks start button', async () => {
      wrapper = createWrapper()
      
      const playerInfoCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'playerInfo'
      )[1]
      playerInfoCallback({ id: '1', isHost: true })
      await nextTick()

      await wrapper.find('.startGameBtn').trigger('click')
      
      expect(mockSocket.emit).toHaveBeenCalledWith('startGame', 'TestRoom')
    })
  })

  describe('Game Start', () => {
    it('transitions from lobby to game when gameStarted event received', async () => {
      wrapper = createWrapper()
      await nextTick()
      
      expect(wrapper.find('.lobby').exists()).toBe(true)
      
      const callback = mockSocket.on.mock.calls.find(
        call => call[0] === 'gameStarted'
      )[1]
      
      callback()
      await nextTick()
      
      expect(wrapper.find('.lobby').exists()).toBe(false)
      expect(wrapper.find('.playfield').exists()).toBe(true)
    })

    it('requests first piece when game starts', async () => {
      wrapper = createWrapper()
      
      const callback = mockSocket.on.mock.calls.find(
        call => call[0] === 'gameStarted'
      )[1]
      
      callback()
      await nextTick()
      
      expect(mockSocket.emit).toHaveBeenCalledWith('requestNextPiece', 'TestRoom')
    })

    it('resets spectrum when game starts', async () => {
      wrapper = createWrapper()
      
      const callback = mockSocket.on.mock.calls.find(
        call => call[0] === 'gameStarted'
      )[1]
      
      callback()
      await nextTick()
      
      expect(mockSocket.emit).toHaveBeenCalledWith('spectrumReset', { room: 'TestRoom' })
    })
  })

  describe('Grid Rendering', () => {
    it('renders grid with correct structure', async () => {
      wrapper = createWrapper()
    
      const gameStartedCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'gameStarted'
      )[1]
      gameStartedCallback()
      await nextTick()
      
      const grid = wrapper.find('.grid')
      expect(grid.exists()).toBe(true)
      
      const cells = wrapper.findAll('.cell')
      expect(cells).toHaveLength(200)
    })
  })

  describe('Piece Spawning', () => {
    it('spawns piece when receiving nextPiece event', async () => {
      wrapper = createWrapper()
      
      const callback = mockSocket.on.mock.calls.find(
        call => call[0] === 'nextPiece'
      )[1]
      
      callback('I')
      await nextTick()
      
      expect(wrapper.vm.currentPiece).toBeTruthy()
      expect(wrapper.vm.currentPiece.type).toBe('I')
    })

    it('spawns piece at starting position', async () => {
      wrapper = createWrapper()
      
      const callback = mockSocket.on.mock.calls.find(
        call => call[0] === 'nextPiece'
      )[1]
      
      callback('T')
      await nextTick()
      
      expect(wrapper.vm.currentPiece.position).toEqual({ x: 3, y: 0 })
    })

    it('initializes piece with rotation 0', async () => {
      wrapper = createWrapper()
      
      const callback = mockSocket.on.mock.calls.find(
        call => call[0] === 'nextPiece'
      )[1]
      
      callback('O')
      await nextTick()
      
      expect(wrapper.vm.currentPiece.rotation).toBe(0)
    })
  })

  describe('Score System', () => {
    it('displays initial score of 0', async () => {
      wrapper = createWrapper()
      
      const gameStartedCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'gameStarted'
      )[1]
      gameStartedCallback()
      await nextTick()
      
      expect(wrapper.find('.score-value').text()).toBe('0')
    })

    it('displays score icon', async () => {
      wrapper = createWrapper()
      
      const gameStartedCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'gameStarted'
      )[1]
      gameStartedCallback()
      await nextTick()
      
      const scoreIcon = wrapper.find('.score-icon')
      expect(scoreIcon.exists()).toBe(true)
      expect(scoreIcon.attributes('alt')).toBe('Score')
    })

    it('calculates correct score for single line', async () => {
      wrapper = createWrapper()
      await nextTick()
      
      wrapper.vm.addScore(1)
      expect(wrapper.vm.score).toBe(100)
    })

    it('calculates correct score for multiple lines', async () => {
      wrapper = createWrapper()
      await nextTick()
      
      wrapper.vm.score = 0
      wrapper.vm.addScore(2)
      expect(wrapper.vm.score).toBe(300)
      
      wrapper.vm.score = 0
      wrapper.vm.addScore(3)
      expect(wrapper.vm.score).toBe(500)
      
      wrapper.vm.score = 0
      wrapper.vm.addScore(4)
      expect(wrapper.vm.score).toBe(800)
    })
  })

  describe('End Game Scenarios', () => {
    it('displays victory message when receiving victory event', async () => {
      wrapper = createWrapper()
      
      const callback = mockSocket.on.mock.calls.find(
        call => call[0] === 'endGameMessage'
      )[1]
      
      callback('victory')
      await nextTick()
      
      const overlay = wrapper.find('.end-game-overlay')
      expect(overlay.exists()).toBe(true)
      expect(overlay.text()).toContain('Hai vinto!')
    })

    it('displays defeat message when receiving defeat event', async () => {
      wrapper = createWrapper()
      
      const callback = mockSocket.on.mock.calls.find(
        call => call[0] === 'endGameMessage'
      )[1]
      
      callback('defeat')
      await nextTick()
      
      const overlay = wrapper.find('.end-game-overlay')
      expect(overlay.exists()).toBe(true)
      expect(overlay.text()).toContain('Game Over')
    })

    it('displays final score on defeat', async () => {
      wrapper = createWrapper()
      wrapper.vm.score = 1500
      
      const callback = mockSocket.on.mock.calls.find(
        call => call[0] === 'endGameMessage'
      )[1]
      
      callback('defeat')
      await nextTick()
      
      expect(wrapper.find('.final-score').text()).toContain('1500')
    })

    it('shows return to lobby button in multiplayer', async () => {
      wrapper = createWrapper()
      
      const callback = mockSocket.on.mock.calls.find(
        call => call[0] === 'endGameMessage'
      )[1]
      
      callback('defeat')
      await nextTick()
      
      const buttons = wrapper.findAll('.end-game-overlay button')
      expect(buttons.length).toBeGreaterThan(0)
      expect(buttons[0].text()).toContain('Torna alla lobby')
    })

    it('submits final score when game ends with victory', async () => {
      wrapper = createWrapper()
      wrapper.vm.score = 2000
      
      const callback = mockSocket.on.mock.calls.find(
        call => call[0] === 'endGameMessage'
      )[1]
      
      callback('victory')
      await nextTick()
      
      expect(mockSocket.emit).toHaveBeenCalledWith('submitScore', {
        player: 'TestPlayer',
        score: 2000
      })
    })

    it('submits final score when game ends with defeat', async () => {
      wrapper = createWrapper()
      wrapper.vm.score = 1500
      
      const callback = mockSocket.on.mock.calls.find(
        call => call[0] === 'endGameMessage'
      )[1]
      
      callback('defeat')
      await nextTick()
      
      expect(mockSocket.emit).toHaveBeenCalledWith('submitScore', {
        player: 'TestPlayer',
        score: 1500
      })
    })
  })

  describe('Penalty System', () => {
    it('ignores penalty if value is 0', async () => {
      wrapper = createWrapper()
      
      const callback = mockSocket.on.mock.calls.find(
        call => call[0] === 'receivePenalty'
      )[1]
      
      const { applyGarbage } = await import('../../../client/src/logic/tetris.js')
      applyGarbage.mockClear()
      
      callback({ penalty: 0 })
      await nextTick()
      
      expect(applyGarbage).not.toHaveBeenCalled()
    })
  })

  describe('Cleanup', () => {
    it('removes socket event listeners on unmount', () => {
      wrapper = createWrapper()
      wrapper.unmount()
      
      expect(mockSocket.off).toHaveBeenCalledWith('lobbyUpdate')
      expect(mockSocket.off).toHaveBeenCalledWith('gameStarted')
      expect(mockSocket.off).toHaveBeenCalledWith('nextPiece')
    })

    it('removes keyboard event listener on unmount', () => {
      const removeEventListener = vi.spyOn(window, 'removeEventListener')
      
      wrapper = createWrapper()
      wrapper.unmount()
      
      expect(removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
    })
  })

  describe('Spectrum Updates', () => {
    it('updates spectrum when receiving spectrumUpdate event', async () => {
      wrapper = createWrapper()
      
      const callback = mockSocket.on.mock.calls.find(
        call => call[0] === 'spectrumUpdate'
      )[1]
      
      const spectraData = {
        spectra: [
          { id: '1', spectrum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] }
        ]
      }
      
      callback(spectraData)
      await nextTick()
      
      expect(wrapper.vm.players).toBeDefined()
    })
  })

  it('calls goToLobby and emits areAllReady', async () => {
    wrapper = createWrapper()

    wrapper.vm.goToLobby()

    expect(mockSocket.emit).toHaveBeenCalledWith('areAllReady', 'TestRoom')
    expect(wrapper.vm.gameStarted).toBe(false)
    expect(wrapper.vm.score).toBe(0)
  })

  it('redirects to home when goToHome is called', async () => {
    wrapper = createWrapper()

    const originalLocation = window.location
    delete window.location
    window.location = { href: '' }

    wrapper.vm.goToHome()

    expect(window.location.href).toBe('/')

    window.location = originalLocation
})
it('rotates piece when rotatePiece is called', async () => {
    wrapper = createWrapper()

    wrapper.vm.currentPiece = {
      type: 'I',
      shape: [[1, 1, 1, 1]],
      position: { x: 3, y: 0 },
      rotation: 0
    }

    wrapper.vm.rotatePiece()

    expect(wrapper.vm.currentPiece.rotation).toBe(0)
})

it('moves piece left on ArrowLeft key press', async () => {
    wrapper = createWrapper()

    wrapper.vm.gameStarted = true
    wrapper.vm.currentPiece = {
      type: 'I',
      shape: [[1, 1, 1, 1]],
      position: { x: 5, y: 0 },
      rotation: 0
    }

    keydownHandler({ key: 'ArrowLeft', preventDefault: vi.fn() })

    expect(wrapper.vm.currentPiece.position.x).toBe(4)
})




})