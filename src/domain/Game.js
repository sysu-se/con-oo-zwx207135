// src/domain/Game.js
import { Sudoku } from "./Sudoku.js"

export class Game {
  constructor({ sudoku }) {
    this.sudoku = sudoku

    this.undoStack = []
    this.redoStack = []
  }

  getSudoku() {
    return this.sudoku
  }

  guess(move) {
    // 保存快照（关键点！）
    this.undoStack.push(this.sudoku.clone())

    // 执行操作
    this.sudoku.guess(move)

    // 清空 redo
    this.redoStack = []
  }

  undo() {
    if (!this.canUndo()) return

    this.redoStack.push(this.sudoku.clone())
    this.sudoku = this.undoStack.pop()
  }

  redo() {
    if (!this.canRedo()) return

    this.undoStack.push(this.sudoku.clone())
    this.sudoku = this.redoStack.pop()
  }

  canUndo() {
    return this.undoStack.length > 0
  }

  canRedo() {
    return this.redoStack.length > 0
  }

  toJSON() {
    return {
      sudoku: this.sudoku.toJSON(),
      undoStack: this.undoStack.map(s => s.toJSON()),
      redoStack: this.redoStack.map(s => s.toJSON())
    }
  }

  static fromJSON(json) {
    const game = new Game({
      sudoku: Sudoku.fromJSON(json.sudoku)
    })

    game.undoStack = json.undoStack.map(Sudoku.fromJSON)
    game.redoStack = json.redoStack.map(Sudoku.fromJSON)

    return game
  }
}
