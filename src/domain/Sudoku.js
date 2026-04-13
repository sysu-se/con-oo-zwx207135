// src/domain/Sudoku.js
export class Sudoku {
  constructor(grid) {
    // 深拷贝
    this.grid = grid.map(row => [...row])
  }

  getGrid() {
    return this.grid.map(row => [...row])
  }

  guess({ row, col, value }) {
    this.grid[row][col] = value
  }

  clone() {
    return new Sudoku(this.getGrid())
  }

  toJSON() {
    return {
      grid: this.grid
    }
  }

  static fromJSON(json) {
    return new Sudoku(json.grid)
  }

  toString() {
    return this.grid.map(r => r.join(" ")).join("\n")
  }
}
