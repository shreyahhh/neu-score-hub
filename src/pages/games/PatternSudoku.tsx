import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Grid, Play, Home } from 'lucide-react';
import { Timer } from '@/components/game/Timer';
import { useNavigate } from 'react-router-dom';
import { EASY_SUDOKU, MEDIUM_SUDOKU, HARD_SUDOKU, Pattern } from '@/data/sudokuQuestions';
import { submitGame } from '@/lib/api';

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
  hard: { size: 6, timer: 120, patterns: ['●', '■', '▲', '★', '◆', '✕'] },
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
    correctFirstAttempts: 0, // New state for correct first attempts
  });

  const startGame = (diff: Difficulty) => {
    setDifficulty(diff);
    setGameState('playing');
    
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
    setIsTimerRunning(false);
    
    try {
      const config = DIFFICULTY_CONFIG[difficulty];
      const allCellsFilled = grid.every(row => row.every(cell => cell.value !== ''));
      const allCorrect = grid.every((row, rowIdx) =>
        row.every((cell, colIdx) => cell.value === solution[rowIdx][colIdx].value)
      );
      const completionStatus = allCellsFilled && allCorrect ? 'completed' : 'partial';

      // Calculate average time per correct entry (simple approximation)
      const totalTimeSpent = config.timer - stats.timeLeft;
      const avgTimePerCorrectEntry = stats.correctEntries > 0 ? (totalTimeSpent / stats.correctEntries) : 0;

      // Determine difficulty multiplier
      let difficultyMultiplier = 1;
      if (difficulty === 'medium') difficultyMultiplier = 1.5;
      if (difficulty === 'hard') difficultyMultiplier = 2.0;

      // Prepare raw data for backend
      const rawData = {
        difficulty,
        correct_entries: stats.correctEntries,
        incorrect_entries: stats.incorrectEntries,
        total_empty_cells: stats.emptyCells,
        time_left_sec: stats.timeLeft,
        total_time_allowed: config.timer,
        total_attempts: stats.totalAttempts,
        avg_time_per_correct_entry: avgTimePerCorrectEntry,
        completion_status: completionStatus,
        grid_size: config.size,
        difficulty_multiplier: difficultyMultiplier,
        correct_first_attempts: stats.correctFirstAttempts,
      };
      
      // Submit to backend for scoring
      const result = await submitGame('sign_sudoku', rawData);
      
      // Backend returns the full game result with scores
      setStats(prev => ({
        ...prev,
        scores: result.scores || {}
      }));
      setGameState('results');
    } catch (error) {
      console.error('Error submitting game:', error);
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
                  <li>• Focus: Math, Reasoning, Speed</li>
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
                  <li>• Empty cells: 19 cells</li>
                  <li>• Focus: Mental Stamina</li>
                </ul>
              </div>
              <Button className="w-full mt-4">Select</Button>
            </Card>

            <Card className="p-6 cursor-pointer hover:border-primary transition-colors" onClick={() => startGame('hard')}>
              <h2 className="text-2xl font-bold mb-4">Hard</h2>
              <div className="space-y-2 text-sm">
                <p><span className="font-semibold">Grid:</span> 6x6</p>
                <ul className="space-y-1 text-sm">
                  <li>• Timer: 120 seconds</li>
                  <li>• 1 puzzle per level</li>
                  <li>• Empty cells: 31 cells</li>
                  <li>• Focus: Attention to Detail, Accuracy</li>
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

              <div className="flex gap-4">
                <Button onClick={handleGameComplete} variant="outline" size="lg">
                  Finish Game
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (gameState === 'results') {
    const scores = (stats as any).scores || {};
    const accuracyPercent = stats.emptyCells > 0 ? (stats.correctEntries / stats.emptyCells * 100) : 0;
    
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">Assessment Complete!</h1>
              <p className="text-5xl font-bold text-primary mb-2">{scores.overall}/100</p>
              <p className="text-muted-foreground">Overall Score</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Accuracy</h3>
                <p className="text-2xl font-bold text-primary">{scores.accuracy}/100</p>
              </Card>
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Reasoning</h3>
                <p className="text-2xl font-bold text-primary">{scores.reasoning}/100</p>
              </Card>
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Speed</h3>
                <p className="text-2xl font-bold text-primary">{scores.speed}/100</p>
              </Card>
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Math</h3>
                <p className="text-2xl font-bold text-primary">{scores.math}/100</p>
              </Card>
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Attention to Detail</h3>
                <p className="text-2xl font-bold text-primary">{scores.attentionToDetail}/100</p>
              </Card>
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Mental Stamina</h3>
                <p className="text-2xl font-bold text-primary">{scores.mentalStamina}/100</p>
              </Card>
            </div>

            <Card className="p-6 mb-6">
              <h3 className="font-semibold mb-4">Performance Statistics</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Correct Entries</p>
                  <p className="text-xl font-bold">{stats.correctEntries}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Incorrect Entries</p>
                  <p className="text-xl font-bold">{stats.incorrectEntries}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Attempts</p>
                  <p className="text-xl font-bold">{stats.totalAttempts}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Accuracy Percentage</p>
                  <p className="text-xl font-bold">{accuracyPercent.toFixed(1)}%</p>
                </div>
              </div>
            </Card>

            <div className="flex gap-4">
              <Button onClick={() => navigate('/')} variant="outline" className="flex-1">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <Button onClick={() => window.location.reload()} className="flex-1">
                Try Again
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
