import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle } from 'lucide-react';

type Pattern = '●' | '■' | '▲' | '★' | '◆' | '✕';
type Difficulty = 'easy' | 'medium' | 'hard';
type Cell = Pattern | null;

interface PuzzleConfig {
  size: number;
  timer: number;
  questions: number;
  patterns: Pattern[];
  prefillPercent: number;
  focusAreas: string[];
}

const DIFFICULTY_CONFIG: Record<Difficulty, PuzzleConfig> = {
  easy: {
    size: 4,
    timer: 60,
    questions: 3,
    patterns: ['●', '■', '▲', '★'],
    prefillPercent: 0.4,
    focusAreas: ['Math', 'Reasoning', 'Speed']
  },
  medium: {
    size: 5,
    timer: 90,
    questions: 3,
    patterns: ['●', '■', '▲', '★', '◆'],
    prefillPercent: 0.35,
    focusAreas: ['Mental Stamina']
  },
  hard: {
    size: 6,
    timer: 120,
    questions: 3,
    patterns: ['●', '■', '▲', '★', '◆', '✕'],
    prefillPercent: 0.25,
    focusAreas: ['Attention to Detail', 'Accuracy']
  }
};

const generateSolution = (size: number, patterns: Pattern[]): Cell[][] => {
  const grid: Cell[][] = Array(size).fill(null).map(() => Array(size).fill(null));
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      grid[row][col] = patterns[(row * size + col) % patterns.length];
    }
  }
  
  return grid;
};

const createPuzzle = (solution: Cell[][], prefillPercent: number): Cell[][] => {
  const puzzle = solution.map(row => [...row]);
  const totalCells = solution.length * solution.length;
  const cellsToRemove = Math.floor(totalCells * (1 - prefillPercent));
  
  let removed = 0;
  while (removed < cellsToRemove) {
    const row = Math.floor(Math.random() * solution.length);
    const col = Math.floor(Math.random() * solution.length);
    if (puzzle[row][col] !== null) {
      puzzle[row][col] = null;
      removed++;
    }
  }
  
  return puzzle;
};

interface GameStats {
  emptyCells: number;
  correctEntries: number;
  incorrectEntries: number;
  totalAttempts: number;
  timeSpent: number;
  totalTimeAllowed: number;
}

export default function PatternSudoku() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'welcome' | 'playing' | 'results'>('welcome');
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [solution, setSolution] = useState<Cell[][]>([]);
  const [userGrid, setUserGrid] = useState<Cell[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [stats, setStats] = useState<GameStats>({
    emptyCells: 0,
    correctEntries: 0,
    incorrectEntries: 0,
    totalAttempts: 0,
    timeSpent: 0,
    totalTimeAllowed: 0
  });

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleQuestionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState, timeLeft]);

  const startGame = (diff: Difficulty) => {
    setDifficulty(diff);
    setGameState('playing');
    setCurrentQuestion(0);
    setStats({
      emptyCells: 0,
      correctEntries: 0,
      incorrectEntries: 0,
      totalAttempts: 0,
      timeSpent: 0,
      totalTimeAllowed: 0
    });
    loadQuestion(diff, 0);
  };

  const loadQuestion = (diff: Difficulty, questionNum: number) => {
    const config = DIFFICULTY_CONFIG[diff];
    const newSolution = generateSolution(config.size, config.patterns);
    const newPuzzle = createPuzzle(newSolution, config.prefillPercent);
    
    setSolution(newSolution);
    setGrid(newPuzzle);
    setUserGrid(newPuzzle.map(row => [...row]));
    setTimeLeft(config.timer);
    setSelectedCell(null);
    
    const empty = newPuzzle.flat().filter(cell => cell === null).length;
    setStats(prev => ({
      ...prev,
      emptyCells: prev.emptyCells + empty,
      totalTimeAllowed: prev.totalTimeAllowed + config.timer
    }));
  };

  const handleCellClick = (row: number, col: number) => {
    if (grid[row][col] === null) {
      setSelectedCell([row, col]);
    }
  };

  const handlePatternClick = (pattern: Pattern) => {
    if (!selectedCell || !difficulty) return;
    
    const [row, col] = selectedCell;
    const newUserGrid = userGrid.map(r => [...r]);
    const wasEmpty = newUserGrid[row][col] === null;
    newUserGrid[row][col] = pattern;
    setUserGrid(newUserGrid);
    
    const isCorrect = solution[row][col] === pattern;
    
    setStats(prev => ({
      ...prev,
      totalAttempts: wasEmpty ? prev.totalAttempts + 1 : prev.totalAttempts,
      correctEntries: isCorrect ? (wasEmpty ? prev.correctEntries + 1 : prev.correctEntries) : prev.correctEntries,
      incorrectEntries: !isCorrect ? (wasEmpty ? prev.incorrectEntries + 1 : prev.incorrectEntries) : prev.incorrectEntries
    }));
  };

  const handleQuestionComplete = () => {
    if (!difficulty) return;
    
    const config = DIFFICULTY_CONFIG[difficulty];
    const timeSpent = config.timer - timeLeft;
    setStats(prev => ({
      ...prev,
      timeSpent: prev.timeSpent + timeSpent
    }));
    
    if (currentQuestion < config.questions - 1) {
      setCurrentQuestion(currentQuestion + 1);
      loadQuestion(difficulty, currentQuestion + 1);
    } else {
      calculateScores();
    }
  };

  const calculateScores = () => {
    if (!difficulty) return;
    
    const diffMultiplier = difficulty === 'easy' ? 1.0 : difficulty === 'medium' ? 1.25 : 1.5;
    
    const accuracy = Math.max(0, Math.min(100,
      ((stats.correctEntries / stats.emptyCells) * 100) - (stats.incorrectEntries * 3)
    ));
    
    const reasoning = Math.min(100,
      (stats.correctEntries / stats.totalAttempts) * 100 * diffMultiplier
    );
    
    const avgTimePerCorrect = stats.timeSpent / (stats.correctEntries + 1);
    const timeLeft = stats.totalTimeAllowed - stats.timeSpent;
    const speed = Math.max(0, Math.min(100,
      (timeLeft / stats.totalTimeAllowed * 50) + (50 / (avgTimePerCorrect + 1))
    ));
    
    const math = (stats.correctEntries / stats.emptyCells) * 100;
    
    const attentionToDetail = Math.min(100,
      (accuracy * 0.6) + ((stats.correctEntries / stats.totalAttempts) * 40)
    );
    
    const mentalStamina = (accuracy + reasoning + speed + math + attentionToDetail) / 5;
    
    const overall = (accuracy * 0.3) + (reasoning * 0.3) + (attentionToDetail * 0.2) + 
                    (speed * 0.1) + (math * 0.1);
    
    setStats(prev => ({
      ...prev,
      scores: {
        accuracy: Math.round(accuracy),
        reasoning: Math.round(reasoning),
        speed: Math.round(speed),
        math: Math.round(math),
        attentionToDetail: Math.round(attentionToDetail),
        mentalStamina: Math.round(mentalStamina),
        overall: Math.round(overall)
      }
    }));
    
    setGameState('results');
  };

  if (gameState === 'welcome') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-6xl w-full">
          <h1 className="text-4xl font-bold mb-8 text-center">Pattern Sudoku Assessment</h1>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((diff) => {
              const config = DIFFICULTY_CONFIG[diff];
              return (
                <Card 
                  key={diff}
                  className="p-6 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => startGame(diff)}
                >
                  <h2 className="text-2xl font-bold mb-4 capitalize">{diff}</h2>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-semibold">Grid:</span> {config.size}x{config.size}</p>
                    <p><span className="font-semibold">Timer:</span> {config.timer}s per puzzle</p>
                    <p><span className="font-semibold">Questions:</span> {config.questions}</p>
                    <p><span className="font-semibold">Patterns:</span> {config.patterns.length}</p>
                    <p className="pt-2"><span className="font-semibold">Focus:</span></p>
                    <ul className="list-disc list-inside text-muted-foreground">
                      {config.focusAreas.map(area => (
                        <li key={area}>{area}</li>
                      ))}
                    </ul>
                  </div>
                  <Button className="w-full mt-4">Select</Button>
                </Card>
              );
            })}
          </div>
          
          <Card className="p-6">
            <h3 className="font-bold mb-3">How to Play:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Fill empty cells so each row contains all unique patterns</li>
              <li>• Each column must also contain all unique patterns</li>
              <li>• Click an empty cell to select it (blue highlight)</li>
              <li>• Click a pattern below to fill the selected cell</li>
              <li>• Complete as many cells as possible before time runs out</li>
            </ul>
          </Card>
        </div>
      </div>
    );
  }

  if (gameState === 'playing' && difficulty) {
    const config = DIFFICULTY_CONFIG[difficulty];
    
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold capitalize">{difficulty} Level</h2>
              <p className="text-muted-foreground">
                Question {currentQuestion + 1} of {config.questions}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="text-2xl font-mono font-bold">{timeLeft}s</span>
            </div>
          </div>

          <Card className="p-8">
            <div 
              className="grid gap-1 mx-auto mb-8"
              style={{ 
                gridTemplateColumns: `repeat(${config.size}, minmax(0, 1fr))`,
                maxWidth: `${config.size * 60}px`
              }}
            >
              {userGrid.map((row, rowIdx) => (
                row.map((cell, colIdx) => {
                  const isOriginal = grid[rowIdx][colIdx] !== null;
                  const isSelected = selectedCell?.[0] === rowIdx && selectedCell?.[1] === colIdx;
                  
                  return (
                    <button
                      key={`${rowIdx}-${colIdx}`}
                      onClick={() => handleCellClick(rowIdx, colIdx)}
                      disabled={isOriginal}
                      className={`
                        aspect-square text-2xl font-bold border-2 rounded
                        ${isOriginal ? 'bg-muted cursor-not-allowed' : 'bg-background cursor-pointer hover:bg-accent'}
                        ${isSelected ? 'border-primary' : 'border-border'}
                        ${!isOriginal && cell !== null ? 'bg-yellow-500/20' : ''}
                      `}
                    >
                      {cell}
                    </button>
                  );
                })
              ))}
            </div>

            <div className="flex justify-center gap-4 flex-wrap">
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

            <Button 
              onClick={handleQuestionComplete}
              className="w-full mt-6"
              size="lg"
            >
              {currentQuestion < config.questions - 1 ? 'Next Question' : 'Finish Assessment'}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (gameState === 'results') {
    const scores = (stats as any).scores || {};
    const accuracyPercent = stats.emptyCells > 0 ? (stats.correctEntries / stats.emptyCells * 100) : 0;
    
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <Card className="p-8 mb-6">
            <div className="text-center mb-8">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h1 className="text-4xl font-bold mb-2">Assessment Complete</h1>
              <p className="text-3xl font-bold text-primary mb-2">{scores.overall}/100</p>
              <p className="text-muted-foreground">Overall Score</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
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
}
