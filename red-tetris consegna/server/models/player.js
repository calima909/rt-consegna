export default class Player {
  constructor(id, name, isHost = false) {
    this.id = id
    this.name = name
    this.isHost = isHost
    this.currentIndex = 0
    this.piecesUsed = []
    this.grid = Player.createEmptyGrid()
    this.isAlive = true
    this.inLobby = true
    this.gridForSpectrum = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    this.spectrum = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    this.maxy = 0
  }

  static ROWS = 20
  static COLS = 10

  static createEmptyGrid() {
    return Array.from({ length: Player.ROWS }, () => Array(Player.COLS).fill(0))
  }

  calcSpectrum(grid) {
    const ROWS = grid.length
    const COLS = grid[0].length
    const spectrum = Array(COLS).fill(0)
    
    this.maxy = 0 

    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        if (grid[y][x] !== 0) {
          const height = ROWS - y
          spectrum[x] = height
        
          if (height > this.maxy) {
            this.maxy = height
          }
          
          break
        }
      }
    }

    return spectrum
  }
}