import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Grid, Play, Home } from 'lucide-react';
import { Timer } from '@/components/game/Timer';
import { useNavigate } from 'react-router-dom';
import { EASY_SUDOKU, MEDIUM_SUDOKU, HARD_SUDOKU, Pattern } from '@/data/sudokuQuestions';
import { submitGame, DEFAULT_USER_ID } from '@/lib/api';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { GameResult } from '@/lib/types';

type Difficulty = 'easy' | 'medium' | 'hard';
type Cell = { value: Pattern; isFixed: boolean; isUserEntry: boolean };

interface PuzzleConfig {
  size: number;
  timer: number;
  patterns: Pattern[];
}

const DIFFICULTY_CONFIG: Record<Difficulty, PuzzleConfig> = {
  easy: { size: 4, timer: 60, patterns: ['●', '■', '▲', '★'] },
  medium: { size: 5, timer: 90, patterns: ['●', '■', '▲', '★', '◆'] },
  hard: { size: 5, timer: 120, patterns: ['●', '■', '▲', '★', '◆'] },
};

const PUZZLE_DATA = {
  easy: EASY_SUDOKU,
  medium: MEDIUM_SUDOKU,
  hard: HARD_SUDOKU,
};

// Convert data format to game format
function initializeGrid(puzzleData: typeof EASY_SUDOKU): { grid: Cell[][], solution: Cell[][] } {
  const size = puzzleData.grid.length;
  const grid: Cell[][] = [];
  const solution: Cell[][] = [];

  for (let i = 0; i < size; i++) {
    grid[i] = [];
    solution[i] = [];
    for (let j = 0; j < size; j++) {
      const value = puzzleData.grid[i][j];
      const solutionValue = puzzleData.solution[i][j];
      
      grid[i][j] = {
        value,
        isFixed: value !== '',
        isUserEntry: false
      };
      
      solution[i][j] = {
        value: solutionValue,
        isFixed: false,
        isUserEntry: false
      };
    }
  }

  return { grid, solution };
}

const PatternSudoku = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'welcome' | 'playing' | 'results'>('welcome');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [solution, setSolution] = useState<Cell[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [stats, setStats] = useState({
    correctEntries: 0,
    incorrectEntries: 0,
    totalAttempts: 0,
    timeLeft: 0,
    totalTime: 0,
    emptyCells: 0,
    correctFirstAttempts: 0,
    hintsUsed: 0, // Track hints used
    startTime: 0, // Track when game started
  });
  const [result, setResult] = useState<GameResult | null>(null);

  const startGame = (diff: Difficulty) => {
    setDifficulty(diff);
    setGameState('playing');
    setResult(null);
    
    const config = DIFFICULTY_CONFIG[diff];
    const puzzleData = PUZZLE_DATA[diff];
    const { grid: initialGrid, solution: sol } = initializeGrid(puzzleData);
    
    setSolution(sol);
    setGrid(initialGrid);
    setSelectedCell(null);
    setIsTimerRunning(true);
    setStats({
      correctEntries: 0,
      incorrectEntries: 0,
      totalAttempts: 0,
      timeLeft: config.timer,
      totalTime: config.timer,
      emptyCells: puzzleData.emptyCells,
      correctFirstAttempts: 0,
      hintsUsed: 0,
      startTime: Date.now(),
    });
  };

  const handleCellClick = (row: number, col: number) => {
    if (!grid[row][col].isFixed) {
      setSelectedCell({ row, col });
    }
  };

  const handlePatternClick = (pattern: Pattern) => {
    if (!selectedCell) return;
    
    const { row, col } = selectedCell;
    const newGrid = grid.map(r => [...r]);
    const wasEmpty = newGrid[row][col].value === '';
    const oldValue = newGrid[row][col].value;
    
    newGrid[row][col] = {
      ...newGrid[row][col],
      value: pattern,
      isUserEntry: true
    };
    setGrid(newGrid);
    
    const isCorrect = solution[row][col].value === pattern;
    const wasCorrectBefore = solution[row][col].value === oldValue;
    const isFirstAttempt = wasEmpty && isCorrect; // Check if it's a correct first attempt

    setStats(prev => ({
      ...prev,
      totalAttempts: wasEmpty ? prev.totalAttempts + 1 : prev.totalAttempts,
      correctEntries: isCorrect && wasEmpty ? prev.correctEntries + 1 :
                     isCorrect && !wasEmpty && !wasCorrectBefore ? prev.correctEntries + 1 :
                     !isCorrect && wasCorrectBefore ? prev.correctEntries - 1 :
                     prev.correctEntries,
      incorrectEntries: !isCorrect && wasEmpty ? prev.incorrectEntries + 1 :
                       !isCorrect && wasCorrectBefore ? prev.incorrectEntries + 1 :
                       isCorrect && !wasCorrectBefore && oldValue !== '' ? prev.incorrectEntries - 1 :
                       prev.incorrectEntries,
      correctFirstAttempts: isFirstAttempt ? prev.correctFirstAttempts + 1 : prev.correctFirstAttempts, // Update correct first attempts
    }));
  };

  const handleGameComplete = async () => {
    try {
      setIsTimerRunning(false);
      const config = DIFFICULTY_CONFIG[difficulty];
      
      // Check if all cells are filled
      const allCellsFilled = grid.every((row) =>
        row.every((cell) => !cell.isFixed && cell.value !== '')
      );

      // Check if solution is correct
      const allCorrect = grid.every((row, rowIdx) =>
        row.every((cell, colIdx) => cell.value === solution[rowIdx][colIdx].value)
      );
      const isCompleted = allCellsFilled && allCorrect;

      // Calculate metrics
      const totalTimeSpent = stats.startTime > 0
        ? (Date.now() - stats.startTime) / 1000
        : (config.timer - stats.timeLeft);

    // Count correct and incorrect entries (only count user-filled cells, not fixed/prefilled cells)
    const correctEntries = grid.reduce((count, row, rowIdx) => {
      return count + row.reduce((rowCount, cell, colIdx) => {
        // Only count cells that are not fixed (user-filled) and match the solution
        if (!cell.isFixed && cell.value !== '' && cell.value === solution[rowIdx][colIdx].value) {
          return rowCount + 1;
        }
        return rowCount;
      }, 0);
    }, 0);

    const incorrectEntries = stats.incorrectEntries;
    const totalAttempts = correctEntries + incorrectEntries;
    
    // Calculate total empty cells (cells that are not fixed/prefilled)
    const totalEmptyCells = grid.reduce((count, row) => {
      return count + row.reduce((rowCount, cell) => {
        // Count cells that are not fixed (these are the cells user needs to fill)
        return rowCount + (cell.isFixed ? 0 : 1);
      }, 0);
    }, 0);

    // Calculate completion percentage
    const completionPercent = totalEmptyCells > 0 
      ? (correctEntries / totalEmptyCells) * 100 
      : 0;

    // Calculate accuracy percentage
    const accuracyPercent = totalAttempts > 0 
      ? (correctEntries / totalAttempts) * 100 
      : 0;

    // Calculate average time per correct entry
    const avgTimePerCorrectEntry = correctEntries > 0 
      ? totalTimeSpent / correctEntries 
      : 0;

    // Time left in seconds
    const timeLeftSec = stats.timeLeft;

    // Difficulty multiplier based on difficulty level
    const difficultyMultipliers = {
      easy: 1.0,
      medium: 1.2,
      hard: 1.5
    };
    const difficultyMultiplier = difficultyMultipliers[difficulty] || 1.0;

    // Grid size (e.g., 4 for 4x4, 9 for 9x9)
    const gridSize = grid.length;

    // Count correct first attempts (entries that were correct on first try)
    // This requires tracking in your game state - for now, estimate as correctEntries - incorrectEntries
    const correctFirstAttempts = Math.max(0, correctEntries - incorrectEntries);

    // Prepare raw data matching backend's expected format
    const rawData = {
      correct_entries: correctEntries,
      incorrect_entries: incorrectEntries,
      total_empty_cells: totalEmptyCells,
      time_left_sec: timeLeftSec,
      total_time_allowed: config.timer,
      total_attempts: totalAttempts,
      avg_time_per_correct_entry: avgTimePerCorrectEntry,
      completion_percent: completionPercent,
      accuracy_percent: accuracyPercent,
      grid_size: gridSize,
      correct_first_attempts: correctFirstAttempts,
      difficulty_multiplier: difficultyMultiplier,
      
      // Keep legacy fields for backward compatibility
      difficulty: difficulty,
      is_completed: isCompleted,
      errors_made: incorrectEntries,
      total_time: totalTimeSpent,
      hints_used: stats.hintsUsed,
    };

    console.log('Submitting raw data:', rawData); // Debug log

    // Submit to backend for scoring
    const gameResult = await submitGame('sign_sudoku', rawData, DEFAULT_USER_ID);
    
    if (gameResult && gameResult.scores) {
      setResult(gameResult);
      setGameState('results');
    } else {
      throw new Error('Invalid response from backend');
    }
  } catch (error) {
    console.error('Error submitting game:', error);
    alert('Failed to submit game. Please try again.');
    // Still show results even if submission failed
    setGameState('results');
  }
};

  const handleTimeout = () => {
    setIsTimerRunning(false);
    handleGameComplete();
  };

  if (gameState === 'welcome') {
    const config = DIFFICULTY_CONFIG;
    
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">Pattern Sudoku</h1>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 cursor-pointer hover:border-primary transition-colors" onClick={() => startGame('easy')}>
              <h2 className="text-2xl font-bold mb-4">Easy</h2>
              <div className="space-y-2 text-sm">
                <p><span className="font-semibold">Grid:</span> 4x4</p>
                <ul className="space-y-1 text-sm">
                  <li>• Timer: 60 seconds</li>
                  <li>• 1 puzzle per level</li>
                  <li>• Empty cells: 9 cells</li>
                </ul>
              </div>
              <Button className="w-full mt-4">Select</Button>
            </Card>

            <Card className="p-6 cursor-pointer hover:border-primary transition-colors" onClick={() => startGame('medium')}>
              <h2 className="text-2xl font-bold mb-4">Medium</h2>
              <div className="space-y-2 text-sm">
                <p><span className="font-semibold">Grid:</span> 5x5</p>
                <ul className="space-y-1 text-sm">
                  <li>• Timer: 90 seconds</li>
                  <li>• 1 puzzle per level</li>
                  <li>• Empty cells: 14 cells</li>
                </ul>
              </div>
              <Button className="w-full mt-4">Select</Button>
            </Card>

            <Card className="p-6 cursor-pointer hover:border-primary transition-colors" onClick={() => startGame('hard')}>
              <h2 className="text-2xl font-bold mb-4">Hard</h2>
              <div className="space-y-2 text-sm">
                <p><span className="font-semibold">Grid:</span> 5x5</p>
                <ul className="space-y-1 text-sm">
                  <li>• Timer: 120 seconds</li>
                  <li>• 1 puzzle per level</li>
                  <li>• Empty cells: 20 cells</li>
                </ul>
              </div>
              <Button className="w-full mt-4">Select</Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'playing') {
    const config = DIFFICULTY_CONFIG[difficulty];
    
    return (
      <div className="container mx-auto px-6 py-8 min-h-screen flex items-center justify-center">
        <div className="max-w-4xl w-full">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Grid className="w-5 h-5 text-primary" />
                  Pattern Sudoku - {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </CardTitle>
                <Timer
                  isRunning={isTimerRunning}
                  initialTime={stats.totalTime}
                  countDown
                  maxTime={stats.totalTime}
                  onComplete={handleTimeout}
                  onTick={(time) => setStats(prev => ({ ...prev, timeLeft: time }))}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div 
                className="grid gap-1 mx-auto"
                style={{ 
                  gridTemplateColumns: `repeat(${config.size}, minmax(0, 1fr))`,
                  maxWidth: `${config.size * 60}px`
                }}
              >
                {grid.map((row, rowIdx) => (
                  row.map((cell, colIdx) => {
                    const isSelected = selectedCell?.row === rowIdx && selectedCell?.col === colIdx;
                    
                    return (
                      <button
                        key={`${rowIdx}-${colIdx}`}
                        onClick={() => handleCellClick(rowIdx, colIdx)}
                        disabled={cell.isFixed}
                        className={`
                          aspect-square text-2xl font-bold border-2 rounded
                          ${cell.isFixed ? 'bg-muted cursor-not-allowed' : 'bg-background cursor-pointer hover:bg-accent'}
                          ${isSelected ? 'border-primary ring-2 ring-primary' : 'border-border'}
                          ${cell.isUserEntry ? 'bg-yellow-500/20' : ''}
                        `}
                      >
                        {cell.value}
                      </button>
                    );
                  })
                ))}
              </div>

              <div className="flex justify-center gap-3 flex-wrap">
                {config.patterns.map((pattern) => (
                  <Button
                    key={pattern}
                    onClick={() => handlePatternClick(pattern)}
                    variant="outline"
                    size="lg"
                    className="text-2xl w-16 h-16"
                    disabled={!selectedCell}
                  >
                    {pattern}
                  </Button>
                ))}
              </div>

              <div className="flex gap-4 justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Correct: {stats.correctEntries} | Errors: {stats.incorrectEntries}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleGameComplete} variant="outline" size="lg">
                    Finish Game
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (gameState === 'results') {
    if (result) {
      return (
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <ScoreDisplay result={result} gameType="sign_sudoku" />
            <div className="mt-6 flex gap-4 justify-center">
              <Button onClick={() => navigate('/')} variant="outline" size="lg">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <Button onClick={() => window.location.reload()} size="lg">
                <Play className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    // Fallback if result is not available
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">Assessment Complete!</h1>
              <p className="text-muted-foreground">Scores are being calculated...</p>
            </div>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/')} variant="outline" size="lg">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return null;
};

export default PatternSudoku;
