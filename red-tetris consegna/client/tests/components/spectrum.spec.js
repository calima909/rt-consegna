import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import Spectrum from '../../../client/src/components/Spectrum.vue'

describe('Spectrum Component', () => {
  let wrapper

  beforeEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  const createWrapper = (props = {}) => {
    return mount(Spectrum, {
      props: {
        playerName: 'TestPlayer',
        spectrum: Array(10).fill(0),
        maxRows: 20,
        ...props
      }
    })
  }

  describe('Component Rendering', () => {
    it('renders the component', () => {
      wrapper = createWrapper()
      expect(wrapper.find('.spectrum').exists()).toBe(true)
    })

    it('displays player name', () => {
      wrapper = createWrapper({ playerName: 'Alice' })
      expect(wrapper.find('h4').text()).toBe('Alice')
    })

    it('renders columns container', () => {
      wrapper = createWrapper()
      expect(wrapper.find('.columns').exists()).toBe(true)
    })

    it('renders 10 columns by default', () => {
      wrapper = createWrapper()
      const columns = wrapper.findAll('.column')
      expect(columns).toHaveLength(10)
    })

    it('renders correct number of rows per column', () => {
      wrapper = createWrapper({ maxRows: 20 })
      const firstColumn = wrapper.findAll('.column')[0]
      const cells = firstColumn.findAll('div')
      expect(cells).toHaveLength(20)
    })
  })

  describe('Props Validation', () => {
    it('accepts playerName prop', () => {
      wrapper = createWrapper({ playerName: 'Bob' })
      expect(wrapper.props('playerName')).toBe('Bob')
    })

    it('accepts spectrum prop as array', () => {
      const spectrum = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      wrapper = createWrapper({ spectrum })
      expect(wrapper.props('spectrum')).toEqual(spectrum)
    })

    it('accepts maxRows prop', () => {
      wrapper = createWrapper({ maxRows: 15 })
      expect(wrapper.props('maxRows')).toBe(15)
    })

    it('uses default spectrum if not provided', () => {
      wrapper = mount(Spectrum, {
        props: {
          playerName: 'Test'
        }
      })
      expect(wrapper.props('spectrum')).toEqual(Array(10).fill(0))
    })

    it('uses default maxRows if not provided', () => {
      wrapper = mount(Spectrum, {
        props: {
          playerName: 'Test',
          spectrum: Array(10).fill(0)
        }
      })
      expect(wrapper.props('maxRows')).toBe(20)
    })
  })

  describe('Spectrum Visualization', () => {
    it('displays empty spectrum with all cells unfilled', () => {
      wrapper = createWrapper({
        spectrum: Array(10).fill(0)
      })
      
      const filledCells = wrapper.findAll('.filled')
      expect(filledCells).toHaveLength(0)
    })

    it('fills cells up to the specified height', () => {
      wrapper = createWrapper({
        spectrum: [5, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        maxRows: 20
      })
      
      const firstColumn = wrapper.findAll('.column')[0]
      const filledCells = firstColumn.findAll('.filled')
      expect(filledCells).toHaveLength(5)
    })

    it('displays different heights for different columns', () => {
      wrapper = createWrapper({
        spectrum: [3, 7, 2, 10, 5, 8, 1, 6, 4, 9]
      })
      
      const columns = wrapper.findAll('.column')
      
      expect(columns[0].findAll('.filled')).toHaveLength(3)
      expect(columns[1].findAll('.filled')).toHaveLength(7)
      expect(columns[2].findAll('.filled')).toHaveLength(2)
      expect(columns[3].findAll('.filled')).toHaveLength(10)
    })

    it('displays full column when height equals maxRows', () => {
      wrapper = createWrapper({
        spectrum: [20, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        maxRows: 20
      })
      
      const firstColumn = wrapper.findAll('.column')[0]
      const filledCells = firstColumn.findAll('.filled')
      expect(filledCells).toHaveLength(20)
    })

    it('handles zero height correctly', () => {
      wrapper = createWrapper({
        spectrum: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      })
      
      const columns = wrapper.findAll('.column')
      columns.forEach(column => {
        const filledCells = column.findAll('.filled')
        expect(filledCells).toHaveLength(0)
      })
    })
  })

  describe('Dynamic Updates', () => {
    it('updates when spectrum prop changes', async () => {
      wrapper = createWrapper({
        spectrum: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      })
      
      expect(wrapper.findAll('.filled')).toHaveLength(0)
      
      await wrapper.setProps({
        spectrum: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5]
      })
      
      expect(wrapper.findAll('.filled')).toHaveLength(50)
    })

    it('updates when playerName changes', async () => {
      wrapper = createWrapper({ playerName: 'Player1' })
      expect(wrapper.find('h4').text()).toBe('Player1')
      
      await wrapper.setProps({ playerName: 'Player2' })
      expect(wrapper.find('h4').text()).toBe('Player2')
    })

    it('updates column count when spectrum length changes', async () => {
      wrapper = createWrapper({
        spectrum: [1, 2, 3, 4, 5]
      })
      
      expect(wrapper.findAll('.column')).toHaveLength(5)
      
      await wrapper.setProps({
        spectrum: [1, 2, 3, 4, 5, 6, 7, 8]
      })
      
      expect(wrapper.findAll('.column')).toHaveLength(8)
    })
  })

  describe('Edge Cases', () => {
    it('handles spectrum with all maximum heights', () => {
      wrapper = createWrapper({
        spectrum: Array(10).fill(20),
        maxRows: 20
      })
      
      const allCells = wrapper.findAll('.column div')
      const filledCells = wrapper.findAll('.filled')
      
      expect(allCells).toHaveLength(200) 
      expect(filledCells).toHaveLength(200) 
    })

    it('handles single column spectrum', () => {
      wrapper = createWrapper({
        spectrum: [10]
      })
      
      const columns = wrapper.findAll('.column')
      expect(columns).toHaveLength(1)
      expect(columns[0].findAll('.filled')).toHaveLength(10)
    })

    it('handles very long player names', () => {
      const longName = 'VeryLongPlayerNameThatShouldStillDisplay'
      wrapper = createWrapper({ playerName: longName })
      expect(wrapper.find('h4').text()).toBe(longName)
    })

    it('handles empty player name', () => {
      wrapper = createWrapper({ playerName: '' })
      expect(wrapper.find('h4').text()).toBe('')
    })

    it('handles spectrum with mixed heights', () => {
      wrapper = createWrapper({
        spectrum: [0, 5, 0, 10, 0, 15, 0, 20, 0, 1]
      })
      
      const columns = wrapper.findAll('.column')
      expect(columns[0].findAll('.filled')).toHaveLength(0)
      expect(columns[1].findAll('.filled')).toHaveLength(5)
      expect(columns[3].findAll('.filled')).toHaveLength(10)
      expect(columns[7].findAll('.filled')).toHaveLength(20)
    })

    it('handles custom maxRows value', () => {
      wrapper = createWrapper({
        spectrum: Array(10).fill(5),
        maxRows: 10
      })
      
      const firstColumn = wrapper.findAll('.column')[0]
      expect(firstColumn.findAll('div')).toHaveLength(10)
    })

    it('renders correctly with minimal maxRows', () => {
      wrapper = createWrapper({
        spectrum: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        maxRows: 5
      })
      
      const columns = wrapper.findAll('.column')
      columns.forEach(column => {
        expect(column.findAll('div')).toHaveLength(5)
        expect(column.findAll('.filled')).toHaveLength(1)
      })
    })
  })

  describe('CSS Classes', () => {
    it('applies filled class to cells below height', () => {
      wrapper = createWrapper({
        spectrum: [3, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      })
      
      const firstColumn = wrapper.findAll('.column')[0]
      const cells = firstColumn.findAll('div')
      
      expect(cells[0].classes()).toContain('filled')
      expect(cells[1].classes()).toContain('filled')
      expect(cells[2].classes()).toContain('filled')
      
      expect(cells[3].classes()).not.toContain('filled')
    })

    it('applies spectrum class to container', () => {
      wrapper = createWrapper()
      expect(wrapper.find('.spectrum').exists()).toBe(true)
    })

    it('applies columns class to columns container', () => {
      wrapper = createWrapper()
      expect(wrapper.find('.columns').exists()).toBe(true)
    })

    it('applies column class to each column', () => {
      wrapper = createWrapper()
      const columns = wrapper.findAll('.column')
      columns.forEach(column => {
        expect(column.classes()).toContain('column')
      })
    })
  })

  describe('Structural Integrity', () => {
    it('maintains correct parent-child structure', () => {
      wrapper = createWrapper()
      
      const spectrum = wrapper.find('.spectrum')
      expect(spectrum.find('h4').exists()).toBe(true)
      expect(spectrum.find('.columns').exists()).toBe(true)
    })

    it('columns are direct children of columns container', () => {
      wrapper = createWrapper()
      
      const columnsContainer = wrapper.find('.columns')
      const columns = columnsContainer.findAll('.column')
      expect(columns).toHaveLength(10)
    })

    it('cells are direct children of columns', () => {
      wrapper = createWrapper({ maxRows: 20 })
      
      const firstColumn = wrapper.findAll('.column')[0]
      const cells = firstColumn.findAll('div')
      expect(cells).toHaveLength(20)
    })
  })

  describe('Real-world Scenarios', () => {
    it('simulates tetris game with varying heights', () => {
      wrapper = createWrapper({
        playerName: 'GamePlayer',
        spectrum: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
      })
      
      expect(wrapper.find('h4').text()).toBe('GamePlayer')
      
      const columns = wrapper.findAll('.column')
      const heights = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
      
      columns.forEach((column, index) => {
        expect(column.findAll('.filled')).toHaveLength(heights[index])
      })
    })

    it('simulates empty board state', () => {
      wrapper = createWrapper({
        playerName: 'NewPlayer',
        spectrum: Array(10).fill(0)
      })
      
      const filledCells = wrapper.findAll('.filled')
      expect(filledCells).toHaveLength(0)
    })

    it('simulates nearly full board', () => {
      wrapper = createWrapper({
        playerName: 'AdvancedPlayer',
        spectrum: [18, 19, 17, 20, 19, 18, 20, 19, 18, 17]
      })
      
      const filledCells = wrapper.findAll('.filled')
      const totalFilled = 18 + 19 + 17 + 20 + 19 + 18 + 20 + 19 + 18 + 17
      expect(filledCells).toHaveLength(totalFilled)
    })

    it('simulates line clear (height reduction)', async () => {
      wrapper = createWrapper({
        spectrum: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10]
      })
      
      expect(wrapper.findAll('.filled')).toHaveLength(100)
      
      await wrapper.setProps({
        spectrum: [6, 6, 6, 6, 6, 6, 6, 6, 6, 6]
      })
      
      expect(wrapper.findAll('.filled')).toHaveLength(60)
    })

    it('simulates garbage lines addition', async () => {
      wrapper = createWrapper({
        spectrum: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5]
      })
      
      expect(wrapper.findAll('.filled')).toHaveLength(50)
      
      await wrapper.setProps({
        spectrum: [7, 7, 7, 7, 7, 7, 7, 7, 7, 7]
      })
      
      expect(wrapper.findAll('.filled')).toHaveLength(70)
    })
  })

  describe('Performance', () => {
    it('handles frequent updates efficiently', async () => {
      wrapper = createWrapper({
        spectrum: Array(10).fill(0)
      })
      
      for (let i = 1; i <= 10; i++) {
        await wrapper.setProps({
          spectrum: Array(10).fill(i)
        })
      }
      
      expect(wrapper.findAll('.filled')).toHaveLength(100)
    })

    it('renders large maxRows without issues', () => {
      wrapper = createWrapper({
        spectrum: Array(10).fill(30),
        maxRows: 30
      })
      
      const allCells = wrapper.findAll('.column div')
      expect(allCells).toHaveLength(300)
    })
  })
})