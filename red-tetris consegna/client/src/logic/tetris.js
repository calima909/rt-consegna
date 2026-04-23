export const ROWS = 20
export const COLS = 10

export const TETRIMINOS = {
  I: [
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
    [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
  ],
  O: [
    [[0,1,1,0],[0,1,1,0],[0,0,0,0]]
  ],
  T: [
    [[0,1,0],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,1],[0,1,0]],
    [[0,1,0],[1,1,0],[0,1,0]],
  ],
  S: [
    [[0,1,1],[1,1,0],[0,0,0]],
    [[0,1,0],[0,1,1],[0,0,1]],
    [[0,0,0],[0,1,1],[1,1,0]],
    [[1,0,0],[1,1,0],[0,1,0]],
  ],
  Z: [
    [[1,1,0],[0,1,1],[0,0,0]],
    [[0,0,1],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,0],[0,1,1]],
    [[0,1,0],[1,1,0],[1,0,0]],
  ],
  J: [
    [[1,0,0],[1,1,1],[0,0,0]],
    [[0,1,1],[0,1,0],[0,1,0]],
    [[0,0,0],[1,1,1],[0,0,1]],
    [[0,1,0],[0,1,0],[1,1,0]],
  ],
  L: [
    [[0,0,1],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,0],[0,1,1]],
    [[0,0,0],[1,1,1],[1,0,0]],
    [[1,1,0],[0,1,0],[0,1,0]],
  ]
}

export const createGrid = () =>
  Array.from({ length: ROWS }, () => Array(COLS).fill(0))

export const hasCollision = (grid, piece, position) => {
  const { x: px, y: py } = position
  const shape = piece.shape
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x] !== 0) {
        const gx = px + x
        const gy = py + y
        if (gy < 0 || gy >= ROWS || gx < 0 || gx >= COLS) return true
        if (grid[gy][gx] !== 0) return true
      }
    }
  }
  return false
}

 
export const mergePiece = (grid, piece, position) => {

  const { x: px, y: py } = position 
  const shape = piece.shape 
  let newGrid = grid.map(row => [...row]) 
   
  for (let y = 0; y < shape.length; y++) { 
    for (let x = 0; x < shape[y].length; x++) { 
      if (shape[y][x] !== 0) {
        newGrid[py + y][px + x] = piece.type
      }
    }
  }
  return newGrid 
}



export const clearLines = (grid) => {
  const newGrid = []
  let linesCleared = 0

  for (const row of grid) {
    const isGarbage = row.includes('P')
    const isFull = row.every(cell => cell !== 0)

    if (isFull && !isGarbage) {
      linesCleared++
    } else {
      newGrid.push(row)
    }
  }

  while (newGrid.length < ROWS) {
    newGrid.unshift(Array(COLS).fill(0))
  }

  return { newGrid, linesCleared }
}

export const rotate = (matrix) => {
  const N = matrix.length
  const rotated = matrix.map((row, y) => row.map((_, x) => matrix[N - 1 - x][y]))
  return rotated
}

export function applyGarbage(grid, lines) {
  let newGrid = grid.map(row => [...row])

  for (let i = 0; i < lines; i++) {
    newGrid.shift()
    const garbageRow = Array(COLS).fill('P')
    newGrid.push(garbageRow)
  }
  return newGrid
}

export const COLORS = {
  I: '#ff4d4d',
  O: '#ff3333',
  T: '#ff1a1a',
  S: '#e60000',
  Z: '#cc0000',
  J: '#b30000',
  L: '#800000',
  P: '#371638'
}
