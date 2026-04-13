import { writable } from 'svelte/store'
import { createGame, createSudoku } from '../domain'

function createGameStore() {
  const { subscribe, set } = writable(null)

  let game = null

  function init(grid) {
    const sudoku = createSudoku(grid)
    game = createGame({ sudoku })
    update()
  }

  function update() {
    set({
      grid: game.getSudoku().getGrid(),
      canUndo: game.canUndo(),
      canRedo: game.canRedo()
    })
  }

  function guess(move) {
    game.guess(move)
    update()
  }

  function undo() {
    game.undo()
    update()
  }

  function redo() {
    game.redo()
    update()
  }

  return {
    subscribe,
    init,
    guess,
    undo,
    redo
  }
}

export const gameStore = createGameStore()