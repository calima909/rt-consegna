import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import Game from '../../../client/src/components/Game.vue'

const mockRouter = { push: vi.fn() }

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
  useRoute: () => ({
    params: { room: ' ', player: 'SPPlayer' } 
  }),
  onBeforeRouteLeave: vi.fn()
}))

const mockSocket = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn()
}

vi.mock('../../../client/src/logic/tetris.js', () => ({
  createGrid: vi.fn(() =>
    Array(20).fill(null).map(() => Array(10).fill(null))
  ),
  TETRIMINOS: {
    I: [[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]]]
  },
  mergePiece: vi.fn(grid => grid),
  hasCollision: vi.fn(() => false),
  clearLines: vi.fn(grid => ({ newGrid: grid, linesCleared: 0 })),
  applyGarbage: vi.fn((grid, lines) => grid),
  COLORS: { I: '#5a0000' }
}))

describe('Game Component – Branch & Function Coverage', () => {
  let wrapper

  const createWrapper = (mode = 'stage') =>
    mount(Game, {
      global: {
        provide: {
          socket: mockSocket,
          gameMode: { value: mode },
          gameSpeed: { value: 1 }
        }
      }
    })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    if (wrapper) wrapper.unmount()
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('starts automatically in SinglePlayerMod', async () => {
    wrapper = createWrapper()
    await nextTick()

    expect(wrapper.vm.gameStarted).toBe(true)
    expect(mockSocket.emit).toHaveBeenCalledWith('requestNextPiece', ' ')
    expect(mockSocket.emit).toHaveBeenCalledWith('spectrumReset', { room: ' ' })
  })

  it('covers completeStage and nextStage flow', async () => {
    wrapper = createWrapper()
    wrapper.vm.currentStage = 1
    wrapper.vm.stageTarget = 1000
    wrapper.vm.score = 1500
    wrapper.vm.gameStarted = true

    await nextTick()

    expect(wrapper.vm.endGameMessage).toBe('stage_complete')
    expect(wrapper.vm.gameStarted).toBe(false)

    await wrapper.find('button').trigger('click')

    expect(wrapper.vm.currentStage).toBe(2)
    expect(wrapper.vm.score).toBe(0)
    expect(wrapper.vm.endGameMessage).toBe(null)
    expect(wrapper.vm.gameStarted).toBe(true)
    expect(wrapper.vm.intervalId).not.toBeNull()
  })

  it('handles spawnPiece collision in SinglePlayer', async () => {
    const { hasCollision } = await import('../../../client/src/logic/tetris.js')
    hasCollision.mockReturnValue(true)

    wrapper = createWrapper()
    await nextTick()

    wrapper.vm.spawnPiece('I')
    await nextTick()

    expect(wrapper.vm.endGameMessage).toBe('defeat')
    expect(wrapper.vm.gameStarted).toBe(false)
    expect(wrapper.vm.currentPiece).toBe(null)
  })

it('covers movePiece collision prevention', async () => {
  const { hasCollision } = await import('../../../client/src/logic/tetris.js')
  hasCollision.mockReturnValue(true)

  wrapper = createWrapper()
  await nextTick()

  wrapper.vm.currentPiece = {
    type: 'I',
    position: { x: 0, y: 0 }
  }

  wrapper.vm.movePiece(1, 0)
  expect(wrapper.vm.currentPiece.position.x).toBe(0)
})

  it('does not rotate piece on collision', async () => {
    const { hasCollision } = await import('../../../client/src/logic/tetris.js')
    hasCollision.mockReturnValue(true)

    wrapper = createWrapper()
    await nextTick()

    wrapper.vm.currentPiece = {
      type: 'I',
      shape: [[[1]]],
      rotation: 0,
      position: { x: 0, y: 0 }
    }

    wrapper.vm.rotatePiece()
    expect(wrapper.vm.currentPiece.rotation).toBe(0)
  })

  it('covers handleKey arrows and space', async () => {
    wrapper = createWrapper()
    await nextTick()

    wrapper.vm.currentPiece = {
      type: 'I',
      position: { x: 0, y: 0 }
    }

    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ']

    keys.forEach(key => {
      const event = { key, preventDefault: vi.fn() }
      wrapper.vm.handleKey(event)
      expect(event.preventDefault).toHaveBeenCalled()
    })
  })

  it('covers goToLobby reset logic', async () => {
    wrapper = createWrapper()
    await nextTick()

    wrapper.vm.currentPiece = { type: 'I' }
    wrapper.vm.score = 300
    wrapper.vm.endGameMessage = 'defeat'
    wrapper.vm.gameStarted = true

    wrapper.vm.goToLobby()

    expect(wrapper.vm.currentPiece).toBe(null)
    expect(wrapper.vm.score).toBe(0)
    expect(wrapper.vm.endGameMessage).toBe(null)
    expect(wrapper.vm.gameStarted).toBe(false)
    expect(mockSocket.emit).toHaveBeenCalledWith('areAllReady', ' ')
  })
  it('cleans up on unload', async () => {
    wrapper = createWrapper()
    await nextTick()

    window.dispatchEvent(new Event('unload'))

    expect(mockSocket.emit).toHaveBeenCalledWith('leaveRoom', { room: ' ' })
  })
  it('covers handleTabClose directly', async () => {
    wrapper = createWrapper()
    await nextTick()

    const e = { preventDefault: vi.fn() }
    wrapper.vm.handleTabClose(e)

    expect(e.preventDefault).toHaveBeenCalled()
    expect(mockSocket.emit).toHaveBeenCalledWith('leaveRoom', { room: ' ' })
  })
})
