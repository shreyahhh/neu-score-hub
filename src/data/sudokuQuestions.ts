export type Pattern = '●' | '■' | '▲' | '★' | '◆' | '✕' | '';

export interface SudokuCell {
  value: Pattern;
  isFixed: boolean;
}

export interface SudokuQuestion {
  id: number;
  grid: Pattern[][];
  solution: Pattern[][];
  emptyCells: number;
}

export const EASY_SUDOKU: SudokuQuestion = {
  id: 1,
  grid: [
    ['●', '■', '', ''],
    ['', '', '●', '■'],
    ['■', '', '', '●'],
    ['', '●', '■', '']
  ],
  solution: [
    ['●', '■', '▲', '★'],
    ['▲', '★', '●', '■'],
    ['■', '▲', '★', '●'],
    ['★', '●', '■', '▲']
  ],
  emptyCells: 9
};

export const MEDIUM_SUDOKU: SudokuQuestion = {
  id: 1,
  grid: [
    ['●', '■', '▲', '', ''],
    ['▲', '', '●', '', ''],
    ['', '', '', '▲', '●'],
    ['◆', '●', '', '', ''],
    ['', '', '◆', '●', '']
  ],
  solution: [
    ['●', '■', '▲', '★', '◆'],
    ['▲', '★', '●', '◆', '■'],
    ['★', '◆', '■', '▲', '●'],
    ['◆', '●', '★', '■', '▲'],
    ['■', '▲', '◆', '●', '★']
  ],
  emptyCells: 14
};

export const HARD_SUDOKU: SudokuQuestion = {
  id: 1,
  grid: [
    ['●', '■', '▲', '', '', ''],
    ['▲', '★', '', '◆', '', ''],
    ['', '', '✕', '▲', '●', ''],
    ['', '', '●', '', '▲', '★'],
    ['', '●', '', '', '■', '◆'],
    ['', '', '◆', '', '★', '●']
  ],
  solution: [
    ['●', '■', '▲', '★', '◆', '✕'],
    ['▲', '★', '●', '◆', '✕', '●'],
    ['★', '◆', '✕', '▲', '●', '■'],
    ['◆', '✕', '●', '■', '▲', '★'],
    ['✕', '●', '★', '▲', '■', '◆'],
    ['■', '▲', '◆', '✕', '★', '●']
  ],
  emptyCells: 18
};
