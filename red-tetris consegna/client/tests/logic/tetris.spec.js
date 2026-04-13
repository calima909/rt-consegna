import { describe, it, expect } from 'vitest'
import {
  createGrid,
  hasCollision,
  mergePiece,
  clearLines,
  rotate,
  applyGarbage
} from '../../../client/src/logic/tetris.js'

describe('Tetris Logic Functions', () => {

  it('createGrid should make a 20x10 empty grid', () => {
    const grid = createGrid()
    expect(grid.length).toBe(20)
    expect(grid[0].length).toBe(10)
  })

  it('hasCollision detects collision outside bounds', () => {
    const grid = createGrid()
    const piece = {
      shape: [[1]],
      position: { x: -1, y: 0 }
    }
    expect(hasCollision(grid, piece, piece.position)).toBe(true)
  })

  it('mergePiece should embed piece into grid', () => {
    const grid = createGrid()
    const piece = {
      type: 'I',
      shape: [[1]],
      position: { x: 0, y: 0 }
    }
    const merged = mergePiece(grid, piece, piece.position)
    expect(merged[0][0]).toBe('I')
  })

  it('clearLines removes full lines only if no garbage', () => {
    const grid = createGrid()
    grid[19] = Array(10).fill(1)
    const { newGrid, linesCleared } = clearLines(grid)
    expect(linesCleared).toBe(1)
    expect(newGrid[19].every(cell => cell === 0)).toBe(true)
  })

  it('rotate rotates matrix correctly', () => {
    const shape = [[1,2],[3,4]]
    const rotated = rotate(shape)
    expect(rotated).toEqual([[3,1],[4,2]])
  })

  it('applyGarbage adds penalty rows at bottom', () => {
    const grid = createGrid()
    const result = applyGarbage(grid, 2)
    expect(result.length).toBe(20)
    expect(result[19].every(c => c === 'P')).toBe(true)
    expect(result[18].every(c => c === 'P')).toBe(true)
  })

})
