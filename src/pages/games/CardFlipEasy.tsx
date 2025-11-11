import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Play, Home, CheckCircle2 } from 'lucide-react';
import { Timer } from '@/components/game/Timer';
import { ProgressBar } from '@/components/game/ProgressBar';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { submitGame, DEFAULT_USER_ID } from '@/lib/api';
import { GameResult } from '@/lib/types';
import { useNavigate } from 'react-router-dom';

// ============================================================================
// TYPES
// ============================================================================

type GameState = 'instructions' | 'stage1' | 'stage1Complete' | 'stage2' | 'stage2Complete' | 'results';

interface CardData {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
  position: number;
}

interface StageData {
  pairsMatched: number;
  totalFlips: number;
  timeTaken: number;
  startTime: number;
  minFlipsPossible: number; // Minimum flips needed if perfect strategy
}

// ============================================================================
// GAME CONFIGURATION
// ============================================================================

const STAGE1_CONFIG = {
  rows: 4,
  cols: 5,
  totalCards: 20,
  totalPairs: 10,
  timeLimit: 60, // seconds
  minFlips: 16 // Minimum flips if perfect (10 pairs * 2 flips - some optimization)
};

const STAGE2_CONFIG = {
  rows: 5,
  cols: 6,
  totalCards: 30,
  totalPairs: 15,
  timeLimit: 90, // seconds
  minFlips: 20 // Minimum flips if perfect
};

// Generate card values with symmetric pattern
const generateCardValues = (totalPairs: number): string[] => {
  const symbols = ['♠', '♥', '♦', '♣', '★', '☆', '●', '○', '■', '□', '▲', '△', '◆', '◇', '▣'];
  const values: string[] = [];
  
  for (let i = 0; i < totalPairs; i++) {
    const symbol = symbols[i % symbols.length];
    values.push(symbol);
    values.push(symbol); // Add pair
  }
  
  // Shuffle the array
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  
  return values;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CardFlipEasy = () => {
  const navigate = useNavigate();
  
  // Game State
  const [gameState, setGameState] = useState<GameState>('instructions');
  const [stage1Data, setStage1Data] = useState<StageData>({
    pairsMatched: 0,
    totalFlips: 0,
    timeTaken: 0,
    startTime: 0,
    minFlipsPossible: STAGE1_CONFIG.minFlips
  });
  const [stage2Data, setStage2Data] = useState<StageData>({
    pairsMatched: 0,
    totalFlips: 0,
    timeTaken: 0,
    startTime: 0,
    minFlipsPossible: STAGE2_CONFIG.minFlips
  });
  
  // Stage 1 Cards
  const [stage1Cards, setStage1Cards] = useState<CardData[]>([]);
  const [stage1FlippedCards, setStage1FlippedCards] = useState<number[]>([]);
  const [stage1IsProcessing, setStage1IsProcessing] = useState(false);
  const [stage1TimerRunning, setStage1TimerRunning] = useState(false);
  
  // Stage 2 Cards
  const [stage2Cards, setStage2Cards] = useState<CardData[]>([]);
  const [stage2FlippedCards, setStage2FlippedCards] = useState<number[]>([]);
  const [stage2IsProcessing, setStage2IsProcessing] = useState(false);
  const [stage2TimerRunning, setStage2TimerRunning] = useState(false);
  
  const [result, setResult] = useState<GameResult | null>(null);

  // ============================================================================
  // INITIALIZE STAGE 1
  // ============================================================================

  const initializeStage1 = useCallback(() => {
    const values = generateCardValues(STAGE1_CONFIG.totalPairs);
    const cards: CardData[] = values.map((value, index) => ({
      id: index,
      value,
      isFlipped: false,
      isMatched: false,
      position: index
    }));
    
    setStage1Cards(cards);
    setStage1FlippedCards([]);
    setStage1IsProcessing(false);
    setStage1Data({
      pairsMatched: 0,
      totalFlips: 0,
      timeTaken: 0,
      startTime: Date.now(),
      minFlipsPossible: STAGE1_CONFIG.minFlips
    });
    setStage1TimerRunning(true);
  }, []);

  // ============================================================================
  // INITIALIZE STAGE 2
  // ============================================================================

  const initializeStage2 = useCallback(() => {
    const values = generateCardValues(STAGE2_CONFIG.totalPairs);
    const cards: CardData[] = values.map((value, index) => ({
      id: index,
      value,
      isFlipped: false,
      isMatched: false,
      position: index
    }));
    
    setStage2Cards(cards);
    setStage2FlippedCards([]);
    setStage2IsProcessing(false);
    setStage2Data({
      pairsMatched: 0,
      totalFlips: 0,
      timeTaken: 0,
      startTime: Date.now(),
      minFlipsPossible: STAGE2_CONFIG.minFlips
    });
    setStage2TimerRunning(true);
  }, []);

  // ============================================================================
  // HANDLE CARD CLICK - STAGE 1
  // ============================================================================

  const handleStage1CardClick = (cardId: number) => {
    if (stage1IsProcessing || !stage1TimerRunning) return;
    
    const card = stage1Cards[cardId];
    if (card.isFlipped || card.isMatched) return;
    
    if (stage1FlippedCards.length >= 2) return;
    
    // Flip the card
    const newCards = [...stage1Cards];
    newCards[cardId].isFlipped = true;
    setStage1Cards(newCards);
    
    const newFlipped = [...stage1FlippedCards, cardId];
    setStage1FlippedCards(newFlipped);
    
    // Update flip count
    setStage1Data(prev => ({ ...prev, totalFlips: prev.totalFlips + 1 }));
    
    // Check if two cards are flipped
    if (newFlipped.length === 2) {
      setStage1IsProcessing(true);
      
      const [firstId, secondId] = newFlipped;
      const firstCard = newCards[firstId];
      const secondCard = newCards[secondId];
      
      if (firstCard.value === secondCard.value) {
        // Match found!
        newCards[firstId].isMatched = true;
        newCards[secondId].isMatched = true;
        setStage1Cards(newCards);
        setStage1FlippedCards([]);
        setStage1IsProcessing(false);
        
        const newPairsMatched = stage1Data.pairsMatched + 1;
        setStage1Data(prev => ({ ...prev, pairsMatched: newPairsMatched }));
        
        // Check if all pairs matched
        if (newPairsMatched === STAGE1_CONFIG.totalPairs) {
          setStage1TimerRunning(false);
          setStage1Data(prev => ({ 
            ...prev, 
            timeTaken: (Date.now() - prev.startTime) / 1000 
          }));
          setTimeout(() => setGameState('stage1Complete'), 500);
        }
      } else {
        // No match - flip back after 1 second
        setTimeout(() => {
          newCards[firstId].isFlipped = false;
          newCards[secondId].isFlipped = false;
          setStage1Cards(newCards);
          setStage1FlippedCards([]);
          setStage1IsProcessing(false);
        }, 1000);
      }
    }
  };

  // ============================================================================
  // HANDLE CARD CLICK - STAGE 2
  // ============================================================================

  const handleStage2CardClick = (cardId: number) => {
    if (stage2IsProcessing || !stage2TimerRunning) return;
    
    const card = stage2Cards[cardId];
    if (card.isFlipped || card.isMatched) return;
    
    if (stage2FlippedCards.length >= 2) return;
    
    // Flip the card
    const newCards = [...stage2Cards];
    newCards[cardId].isFlipped = true;
    setStage2Cards(newCards);
    
    const newFlipped = [...stage2FlippedCards, cardId];
    setStage2FlippedCards(newFlipped);
    
    // Update flip count
    setStage2Data(prev => ({ ...prev, totalFlips: prev.totalFlips + 1 }));
    
    // Check if two cards are flipped
    if (newFlipped.length === 2) {
      setStage2IsProcessing(true);
      
      const [firstId, secondId] = newFlipped;
      const firstCard = newCards[firstId];
      const secondCard = newCards[secondId];
      
      if (firstCard.value === secondCard.value) {
        // Match found!
        newCards[firstId].isMatched = true;
        newCards[secondId].isMatched = true;
        setStage2Cards(newCards);
        setStage2FlippedCards([]);
        setStage2IsProcessing(false);
        
        const newPairsMatched = stage2Data.pairsMatched + 1;
        setStage2Data(prev => ({ ...prev, pairsMatched: newPairsMatched }));
        
        // Check if all pairs matched
        if (newPairsMatched === STAGE2_CONFIG.totalPairs) {
          setStage2TimerRunning(false);
          setStage2Data(prev => ({ 
            ...prev, 
            timeTaken: (Date.now() - prev.startTime) / 1000 
          }));
          setTimeout(() => finishGame(), 500);
        }
      } else {
        // No match - flip back after 1 second
        setTimeout(() => {
          newCards[firstId].isFlipped = false;
          newCards[secondId].isFlipped = false;
          setStage2Cards(newCards);
          setStage2FlippedCards([]);
          setStage2IsProcessing(false);
        }, 1000);
      }
    }
  };

  // ============================================================================
  // TIMER HANDLERS
  // ============================================================================

  const handleStage1Timeout = () => {
    setStage1TimerRunning(false);
    setStage1Data(prev => ({ 
      ...prev, 
      timeTaken: prev.startTime > 0 ? (Date.now() - prev.startTime) / 1000 : STAGE1_CONFIG.timeLimit
    }));
    setTimeout(() => setGameState('stage1Complete'), 500);
  };

  const handleStage2Timeout = () => {
    setStage2TimerRunning(false);
    setStage2Data(prev => ({ 
      ...prev, 
      timeTaken: prev.startTime > 0 ? (Date.now() - prev.startTime) / 1000 : STAGE2_CONFIG.timeLimit
    }));
    setTimeout(() => finishGame(), 500);
  };

  // ============================================================================
  // FINISH GAME & SUBMIT
  // ============================================================================

  const finishGame = async () => {
    setStage2TimerRunning(false);
    setStage2Data(prev => ({ 
      ...prev, 
      timeTaken: prev.timeTaken || (Date.now() - prev.startTime) / 1000 
    }));
    
    try {
      // Calculate strategy adherence for each stage
      const stage1Strategy = stage1Data.totalFlips > 0 
        ? Math.min(1, stage1Data.minFlipsPossible / stage1Data.totalFlips)
        : 0;
      const stage2Strategy = stage2Data.totalFlips > 0
        ? Math.min(1, stage2Data.minFlipsPossible / stage2Data.totalFlips)
        : 0;
      const avgStrategyAdherence = (stage1Strategy + stage2Strategy) / 2;

      // Prepare raw data for backend
      const raw_data = {
        stage1: {
          pairs_matched: stage1Data.pairsMatched,
          total_pairs: STAGE1_CONFIG.totalPairs,
          total_flips: stage1Data.totalFlips,
          min_flips_possible: stage1Data.minFlipsPossible,
          time_taken: stage1Data.timeTaken,
          time_limit: STAGE1_CONFIG.timeLimit,
          strategy_adherence: stage1Strategy
        },
        stage2: {
          pairs_matched: stage2Data.pairsMatched,
          total_pairs: STAGE2_CONFIG.totalPairs,
          total_flips: stage2Data.totalFlips,
          min_flips_possible: stage2Data.minFlipsPossible,
          time_taken: stage2Data.timeTaken,
          time_limit: STAGE2_CONFIG.timeLimit,
          strategy_adherence: stage2Strategy
        },
        totals: {
          total_pairs_matched: stage1Data.pairsMatched + stage2Data.pairsMatched,
          total_pairs_possible: STAGE1_CONFIG.totalPairs + STAGE2_CONFIG.totalPairs,
          total_actual_flips: stage1Data.totalFlips + stage2Data.totalFlips,
          total_min_flips: stage1Data.minFlipsPossible + stage2Data.minFlipsPossible,
          total_time_taken: stage1Data.timeTaken + stage2Data.timeTaken,
          total_time_limit: STAGE1_CONFIG.timeLimit + STAGE2_CONFIG.timeLimit,
          avg_strategy_adherence: avgStrategyAdherence
        }
      };

      const gameResult = await submitGame('card_flip_challenge', raw_data, DEFAULT_USER_ID);
      
      if (gameResult && gameResult.scores) {
        setResult(gameResult);
        setGameState('results');
      } else {
        throw new Error('Invalid response from backend');
      }
    } catch (error) {
      console.error('Error submitting game:', error);
      alert('Failed to submit game. Please try again.');
      setGameState('stage2Complete');
    }
  };

  // ============================================================================
  // START GAME
  // ============================================================================

  const startGame = () => {
    initializeStage1();
    setGameState('stage1');
  };

  const startStage2 = () => {
    initializeStage2();
    setGameState('stage2');
  };

  // ============================================================================
  // RENDER CARD GRID
  // ============================================================================

  const renderCardGrid = (
    cards: CardData[],
    rows: number,
    cols: number,
    onCardClick: (id: number) => void
  ) => {
    return (
      <div 
        className="grid gap-2 mx-auto"
        style={{ 
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          maxWidth: '600px'
        }}
      >
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => onCardClick(card.id)}
            disabled={card.isMatched || card.isFlipped}
            className={`
              aspect-square w-full
              rounded-lg border-2 transition-all duration-300
              flex items-center justify-center text-3xl font-bold
              ${card.isMatched 
                ? 'bg-green-500 border-green-600 text-white cursor-default' 
                : card.isFlipped
                ? 'bg-blue-100 border-blue-400 text-blue-900'
                : 'bg-gray-200 border-gray-300 hover:bg-gray-300 cursor-pointer'
              }
              ${card.isMatched ? 'scale-95' : 'hover:scale-105'}
            `}
          >
            {card.isFlipped || card.isMatched ? card.value : '?'}
          </button>
        ))}
      </div>
    );
  };

  // ============================================================================
  // RENDER INSTRUCTIONS
  // ============================================================================

  if (gameState === 'instructions') {
    return (
      <div className="container mx-auto px-6 py-8 min-h-screen flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <CreditCard className="w-6 h-6 text-primary" />
                Symmetric Flip Challenge
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Instructions</h3>
                <p className="text-muted-foreground mb-4">
                  This is a memory and pattern test. Find all the matching pairs.
                </p>
                <p className="text-muted-foreground mb-4">
                  The pairs are not random. There is a hidden logical pattern to discover.
                </p>
                <p className="text-muted-foreground mb-4">
                  Find the pairs as quickly as you can. There are 2 stages. Good luck!
                </p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Game Details:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Stage 1: 4×5 grid (10 pairs) - 60 seconds</li>
                  <li>• Stage 2: 5×6 grid (15 pairs) - 90 seconds</li>
                  <li>• Click two cards to flip them</li>
                  <li>• Matching pairs stay face-up</li>
                  <li>• Non-matching pairs flip back after 1 second</li>
                </ul>
              </div>
              <Button onClick={startGame} className="w-full" size="lg">
                <Play className="w-4 h-4 mr-2" />
                Start Game
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER STAGE 1
  // ============================================================================

  if (gameState === 'stage1') {
    const timeRemaining = Math.max(0, STAGE1_CONFIG.timeLimit - ((Date.now() - stage1Data.startTime) / 1000));
    
    return (
      <div className="container mx-auto px-6 py-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Stage 1 of 2: Find the Pairs
                </CardTitle>
                <Timer
                  key="stage1"
                  isRunning={stage1TimerRunning}
                  initialTime={STAGE1_CONFIG.timeLimit}
                  countDown
                  maxTime={STAGE1_CONFIG.timeLimit}
                  onComplete={handleStage1Timeout}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center text-sm">
                <div>
                  Pairs Found: <span className="font-bold">{stage1Data.pairsMatched} / {STAGE1_CONFIG.totalPairs}</span>
                </div>
                <div>
                  Flips: <span className="font-bold">{stage1Data.totalFlips}</span>
                </div>
              </div>
              
              {renderCardGrid(stage1Cards, STAGE1_CONFIG.rows, STAGE1_CONFIG.cols, handleStage1CardClick)}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER STAGE 1 COMPLETE
  // ============================================================================

  if (gameState === 'stage1Complete') {
    return (
      <div className="container mx-auto px-6 py-8 min-h-screen flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <Card>
            <CardContent className="pt-6 space-y-6 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold">✓ Stage 1 Complete!</h2>
              <p className="text-muted-foreground">
                Get ready for Stage 2. The grid is larger.
              </p>
              <Button onClick={startStage2} className="w-full" size="lg">
                <Play className="w-4 h-4 mr-2" />
                Start Stage 2
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER STAGE 2
  // ============================================================================

  if (gameState === 'stage2') {
    const timeRemaining = Math.max(0, STAGE2_CONFIG.timeLimit - ((Date.now() - stage2Data.startTime) / 1000));
    
    return (
      <div className="container mx-auto px-6 py-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Stage 2 of 2: Find the Pairs
                </CardTitle>
                <Timer
                  key="stage2"
                  isRunning={stage2TimerRunning}
                  initialTime={STAGE2_CONFIG.timeLimit}
                  countDown
                  maxTime={STAGE2_CONFIG.timeLimit}
                  onComplete={handleStage2Timeout}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center text-sm">
                <div>
                  Pairs Found: <span className="font-bold">{stage2Data.pairsMatched} / {STAGE2_CONFIG.totalPairs}</span>
                </div>
                <div>
                  Flips: <span className="font-bold">{stage2Data.totalFlips}</span>
                </div>
              </div>
              
              {renderCardGrid(stage2Cards, STAGE2_CONFIG.rows, STAGE2_CONFIG.cols, handleStage2CardClick)}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER STAGE 2 COMPLETE (Before Results)
  // ============================================================================

  if (gameState === 'stage2Complete') {
    return (
      <div className="container mx-auto px-6 py-8 min-h-screen flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <Card>
            <CardContent className="pt-6 space-y-6 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold">🎉 Challenge Complete! 🎉</h2>
              <p className="text-muted-foreground">
                You have successfully completed this part of the assessment.
              </p>
              <div className="flex gap-4">
                <Button onClick={() => navigate('/')} variant="outline" className="flex-1">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER RESULTS
  // ============================================================================

  if (gameState === 'results' && result) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <ScoreDisplay result={result} gameType="card_flip_challenge" />
          <div className="mt-6 flex gap-4 justify-center">
            <Button onClick={() => navigate('/')} variant="outline" size="lg">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default CardFlipEasy;
