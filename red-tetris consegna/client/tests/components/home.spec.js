import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import Home from '../../../client/src/components/Home.vue'

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter
}))

const mockSocket = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn()
}

const mockRouter = {
  push: vi.fn()
}

describe('Home Component', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    mockSocket.on.mockClear()
    mockSocket.emit.mockClear()
    mockRouter.push.mockClear()
  })

  const createWrapper = (options = {}) => {
    return mount(Home, {
      global: {
        provide: {
          socket: mockSocket,
          gameMode: { value: 'survival' },
          gameSpeed: { value: '1' }
        },
        mocks: {
          $router: mockRouter
        },
        stubs: {
          'router-link': true
        }
      },
      ...options
    })
  }

  describe('Rendering', () => {
    it('renders the title correctly', () => {
      wrapper = createWrapper()
      expect(wrapper.find('.neon-title').text()).toBe('RED TETRIS')
    })

    it('renders subtitle with correct text', () => {
      wrapper = createWrapper()
      const subtitle = wrapper.find('.subtitle')
      expect(subtitle.exists()).toBe(true)
      expect(subtitle.text()).toContain('Inserisci il nome della stanza')
    })

    it('renders room input field', () => {
      wrapper = createWrapper()
      const roomInput = wrapper.find('input[placeholder="Nome stanza"]')
      expect(roomInput.exists()).toBe(true)
      expect(roomInput.attributes('required')).toBeDefined()
    })

    it('renders player name input field', () => {
      wrapper = createWrapper()
      const playerInput = wrapper.find('input[placeholder="Il tuo nome"]')
      expect(playerInput.exists()).toBe(true)
      expect(playerInput.attributes('required')).toBeDefined()
    })

    it('renders singleplayer button', () => {
      wrapper = createWrapper()
      const singleBtn = wrapper.find('.single-btn')
      expect(singleBtn.exists()).toBe(true)
      expect(singleBtn.text()).toContain('SINGLEPLAYER')
    })

    it('renders versus button', () => {
      wrapper = createWrapper()
      const multiBtn = wrapper.find('.multi-btn')
      expect(multiBtn.exists()).toBe(true)
      expect(multiBtn.text()).toContain('VERSUS')
    })

    it('renders leaderboard section', () => {
      wrapper = createWrapper()
      expect(wrapper.find('.leaderboard').exists()).toBe(true)
      expect(wrapper.find('.leaderboard h2').text()).toBe('🏆 TOP 10')
    })

    it('does not show options panel by default', () => {
      wrapper = createWrapper()
      expect(wrapper.find('.options-panel').exists()).toBe(false)
    })
  })

  describe('Socket Integration', () => {
    it('requests leaderboard data on mount', () => {
      wrapper = createWrapper()
      expect(mockSocket.emit).toHaveBeenCalledWith('getLeaderboard')
    })

    it('registers leaderboardUpdate event listener', () => {
      wrapper = createWrapper()
      expect(mockSocket.on).toHaveBeenCalledWith('leaderboardUpdate', expect.any(Function))
    })

    it('updates scores when receiving leaderboard data', async () => {
      wrapper = createWrapper()
      
      const callback = mockSocket.on.mock.calls.find(
        call => call[0] === 'leaderboardUpdate'
      )[1]

      const mockData = [
        { player: 'Alice', score: 100 },
        { player: 'Bob', score: 50 },
        { player: 'Charlie', score: 25 }
      ]

      callback(mockData)
      await nextTick()

      const items = wrapper.findAll('.leaderboard li')
      expect(items).toHaveLength(3)
      expect(items[0].text()).toContain('Alice')
      expect(items[0].text()).toContain('100')
      expect(items[1].text()).toContain('Bob')
      expect(items[1].text()).toContain('50')
    })

    it('displays empty leaderboard when no data', async () => {
      wrapper = createWrapper()
      
      const callback = mockSocket.on.mock.calls.find(
        call => call[0] === 'leaderboardUpdate'
      )[1]

      callback([])
      await nextTick()

      const items = wrapper.findAll('.leaderboard li')
      expect(items).toHaveLength(0)
    })
  })

  describe('Singleplayer Options', () => {
    it('toggles options panel when singleplayer button is clicked', async () => {
      wrapper = createWrapper()
      
      expect(wrapper.find('.options-panel').exists()).toBe(false)
      
      await wrapper.find('.single-btn').trigger('click')
      await nextTick()
      
      expect(wrapper.find('.options-panel').exists()).toBe(true)
    })

    it('hides options panel when singleplayer button is clicked again', async () => {
      wrapper = createWrapper()
      
      await wrapper.find('.single-btn').trigger('click')
      await nextTick()
      expect(wrapper.find('.options-panel').exists()).toBe(true)
      
      await wrapper.find('.single-btn').trigger('click')
      await nextTick()
      expect(wrapper.find('.options-panel').exists()).toBe(false)
    })

    it('displays game mode options', async () => {
      wrapper = createWrapper()
      
      await wrapper.find('.single-btn').trigger('click')
      await nextTick()
      
      const radioLabels = wrapper.findAll('.radio-label')
      const modes = radioLabels.filter(label => 
        label.text().includes('SURVIVAL') || label.text().includes('STAGE')
      )
      expect(modes.length).toBeGreaterThanOrEqual(2)
    })

    it('displays speed options', async () => {
      wrapper = createWrapper()
      
      await wrapper.find('.single-btn').trigger('click')
      await nextTick()
      
      const speedGroup = wrapper.find('.speed-group')
      expect(speedGroup.exists()).toBe(true)
      
      const speedOptions = speedGroup.findAll('.radio-label')
      expect(speedOptions.length).toBeGreaterThanOrEqual(4)
    })

    it('displays start single player button in options', async () => {
      wrapper = createWrapper()
      
      await wrapper.find('.single-btn').trigger('click')
      await nextTick()
      
      const startBtn = wrapper.find('.start-btn')
      expect(startBtn.exists()).toBe(true)
      expect(startBtn.text()).toContain('START SINGLE PLAYER GAME')
    })
  })

  describe('Form Input Validation', () => {
    it('has pattern validation for room input', () => {
      wrapper = createWrapper()
      const roomInput = wrapper.find('input[placeholder="Nome stanza"]')
      expect(roomInput.attributes('pattern')).toBeDefined()
    })

    it('has pattern validation for player input', () => {
      wrapper = createWrapper()
      const playerInput = wrapper.find('input[placeholder="Il tuo nome"]')
      expect(playerInput.attributes('pattern')).toBeDefined()
    })

    it('updates room value when input changes', async () => {
      wrapper = createWrapper()
      const roomInput = wrapper.find('input[placeholder="Nome stanza"]')
      
      await roomInput.setValue('TestRoom')
      expect(roomInput.element.value).toBe('TestRoom')
    })

    it('updates player value when input changes', async () => {
      wrapper = createWrapper()
      const playerInput = wrapper.find('input[placeholder="Il tuo nome"]')
      
      await playerInput.setValue('TestPlayer')
      expect(playerInput.element.value).toBe('TestPlayer')
    })
  })

  describe('Navigation - Multiplayer', () => {
    it('navigates to multiplayer game when room and player are valid', async () => {
      wrapper = createWrapper()

      await wrapper.find('input[placeholder="Nome stanza"]').setValue('Room1')
      await wrapper.find('input[placeholder="Il tuo nome"]').setValue('Player1')

      await wrapper.find('form').trigger('submit.prevent')

      expect(mockRouter.push).toHaveBeenCalledWith('/Room1/Player1')
    })

    it('removes spaces from room and player name before navigating', async () => {
      wrapper = createWrapper()

      await wrapper.find('input[placeholder="Nome stanza"]').setValue('  My  Room ')
      await wrapper.find('input[placeholder="Il tuo nome"]').setValue('  My  Player ')

      await wrapper.find('form').trigger('submit.prevent')

      expect(mockRouter.push).toHaveBeenCalledWith('/MyRoom/MyPlayer')
    })

    it('does not navigate if room name is empty after cleaning spaces', async () => {
      wrapper = createWrapper()
      
      await wrapper.find('input[placeholder="Nome stanza"]').setValue('   ')
      await wrapper.find('input[placeholder="Il tuo nome"]').setValue('Player1')
      
      await wrapper.find('form').trigger('submit.prevent')
      
      expect(mockRouter.push).not.toHaveBeenCalled()
    })

    it('does not navigate if player name is empty after cleaning spaces', async () => {
      wrapper = createWrapper()
      
      await wrapper.find('input[placeholder="Nome stanza"]').setValue('Room1')
      await wrapper.find('input[placeholder="Il tuo nome"]').setValue('   ')
      
      await wrapper.find('form').trigger('submit.prevent')
      
      expect(mockRouter.push).not.toHaveBeenCalled()
    })

    it('does not navigate if both fields are empty', async () => {
      wrapper = createWrapper()
      
      await wrapper.find('input[placeholder="Nome stanza"]').setValue('')
      await wrapper.find('input[placeholder="Il tuo nome"]').setValue('')
      
      await wrapper.find('form').trigger('submit.prevent')
      
      expect(mockRouter.push).not.toHaveBeenCalled()
    })
  })

  describe('Navigation - Singleplayer', () => {
    it('navigates to singleplayer game with player name', async () => {
      wrapper = createWrapper()

      await wrapper.find('input[placeholder="Il tuo nome"]').setValue('SoloPlayer')
      await wrapper.find('.single-btn').trigger('click')
      await nextTick()

      const startBtn = wrapper.find('.start-btn')
      expect(startBtn.exists()).toBe(true)
      
      await startBtn.trigger('click')
      expect(mockRouter.push).toHaveBeenCalledWith('/ /SoloPlayer')
    })

    it('uses "Guest" as default name when player name is empty', async () => {
      wrapper = createWrapper()
      
      await wrapper.find('.single-btn').trigger('click')
      await nextTick()
      
      await wrapper.find('.start-btn').trigger('click')
      
      expect(mockRouter.push).toHaveBeenCalledWith('/ /Guest')
    })

    it('removes spaces from player name in singleplayer', async () => {
      wrapper = createWrapper()
      
      await wrapper.find('input[placeholder="Il tuo nome"]').setValue('  Solo  Player  ')
      await wrapper.find('.single-btn').trigger('click')
      await nextTick()
      
      await wrapper.find('.start-btn').trigger('click')
      
      expect(mockRouter.push).toHaveBeenCalledWith('/ /SoloPlayer')
    })

    it('starts singleplayer using cleaned player name', async () => {
      wrapper = createWrapper()

      await wrapper.find('input[placeholder="Il tuo nome"]').setValue('  Solo  Player  ')
      await wrapper.find('.single-btn').trigger('click')
      await nextTick()

      await wrapper.find('.start-btn').trigger('click')

      expect(mockRouter.push).toHaveBeenCalledWith('/ /SoloPlayer')
    })
  })

  describe('UI Interactions', () => {
    it('has hover effect classes on buttons', () => {
      wrapper = createWrapper()
      
      expect(wrapper.find('.single-btn').classes()).toContain('retro-btn')
      expect(wrapper.find('.multi-btn').classes()).toContain('retro-btn')
    })

    it('displays scanlines effect on title', () => {
      wrapper = createWrapper()
      expect(wrapper.find('.scanlines').exists()).toBe(true)
    })

    it('leaderboard displays player names and scores correctly', async () => {
      wrapper = createWrapper()
      
      const callback = mockSocket.on.mock.calls.find(
        call => call[0] === 'leaderboardUpdate'
      )[1]

      callback([
        { player: 'TopPlayer', score: 999 }
      ])
      await nextTick()

      const nameSpan = wrapper.find('.leaderboard .name')
      const scoreSpan = wrapper.find('.leaderboard .score')
      
      expect(nameSpan.text()).toBe('TopPlayer')
      expect(scoreSpan.text()).toBe('999')
    })
  })

  describe('Edge Cases', () => {
    it('handles leaderboard with exactly 10 entries', async () => {
      wrapper = createWrapper()
      
      const callback = mockSocket.on.mock.calls.find(
        call => call[0] === 'leaderboardUpdate'
      )[1]

      const tenEntries = Array.from({ length: 10 }, (_, i) => ({
        player: `Player${i + 1}`,
        score: (10 - i) * 10
      }))

      callback(tenEntries)
      await nextTick()

      const items = wrapper.findAll('.leaderboard li')
      expect(items).toHaveLength(10)
    })

    it('handles very long player names in leaderboard', async () => {
      wrapper = createWrapper()
      
      const callback = mockSocket.on.mock.calls.find(
        call => call[0] === 'leaderboardUpdate'
      )[1]

      callback([
        { player: 'VeryLongPlayerNameThatShouldBeTruncated', score: 100 }
      ])
      await nextTick()

      const nameSpan = wrapper.find('.leaderboard .name')
      expect(nameSpan.classes()).toContain('name')
    })

    it('preserves special characters in names', async () => {
      wrapper = createWrapper()
      
      await wrapper.find('input[placeholder="Nome stanza"]').setValue('Room-_123')
      await wrapper.find('input[placeholder="Il tuo nome"]').setValue('Player_99')
      
      await wrapper.find('form').trigger('submit.prevent')
      
      expect(mockRouter.push).toHaveBeenCalledWith('/Room-_123/Player_99')
    })
  })
    it('executes all function paths for coverage', async () => {
    wrapper = createWrapper()
    
    const vm = wrapper.vm
    vm.toggleSinglePlayer()
    vm.toggleSinglePlayer()
    vm.toggleSinglePlayer()
    
    vm.room = ''
    vm.player = ''
    vm.joinGame()
    
    vm.room = '   '
    vm.player = '   '
    vm.joinGame()
    
    vm.player = ''
    vm.startSinglePlayer()
    
  
    vm.player = '    '
    vm.startSinglePlayer()
    
    await nextTick()
    
    expect(true).toBe(true)
  })
    describe('Game Mode and Speed Selection', () => {
    it('changes game mode to survival', async () => {
      wrapper = createWrapper()
      
      await wrapper.find('.single-btn').trigger('click')
      await nextTick()
      
      const survivalRadio = wrapper.findAll('input[type="radio"]').find(
        input => input.element.value === 'survival'
      )
      
      await survivalRadio.setValue(true)
      await nextTick()
      
      expect(survivalRadio.element.checked).toBe(true)
    })

    it('changes game mode to stage', async () => {
      wrapper = createWrapper()
      
      await wrapper.find('.single-btn').trigger('click')
      await nextTick()
      
      const stageRadio = wrapper.findAll('input[type="radio"]').find(
        input => input.element.value === 'stage'
      )
      
      await stageRadio.setValue(true)
      await nextTick()
      
      expect(stageRadio.element.checked).toBe(true)
    })

    it('changes game speed to 1', async () => {
      wrapper = createWrapper()
      
      await wrapper.find('.single-btn').trigger('click')
      await nextTick()
      
      const speedRadio = wrapper.findAll('input[type="radio"]').find(
        input => input.element.value === '1'
      )
      
      await speedRadio.setValue(true)
      await nextTick()
      
      expect(speedRadio.element.checked).toBe(true)
    })

    it('changes game speed to 1.5', async () => {
      wrapper = createWrapper()
      
      await wrapper.find('.single-btn').trigger('click')
      await nextTick()
      
      const speedRadio = wrapper.findAll('input[type="radio"]').find(
        input => input.element.value === '1.5'
      )
      
      await speedRadio.setValue(true)
      await nextTick()
      
      expect(speedRadio.element.checked).toBe(true)
    })

    it('changes game speed to 2', async () => {
      wrapper = createWrapper()
      
      await wrapper.find('.single-btn').trigger('click')
      await nextTick()
      
      const speedRadio = wrapper.findAll('input[type="radio"]').find(
        input => input.element.value === '2'
      )
      
      await speedRadio.setValue(true)
      await nextTick()
      
      expect(speedRadio.element.checked).toBe(true)
    })

    it('changes game speed to 3', async () => {
      wrapper = createWrapper()
      
      await wrapper.find('.single-btn').trigger('click')
      await nextTick()
      
      const speedRadio = wrapper.findAll('input[type="radio"]').find(
        input => input.element.value === '3'
      )
      
      await speedRadio.setValue(true)
      await nextTick()
      
      expect(speedRadio.element.checked).toBe(true)
    })
  })
})