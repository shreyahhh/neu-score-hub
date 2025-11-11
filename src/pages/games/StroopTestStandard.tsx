import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Play } from 'lucide-react';
import { Timer } from '@/components/game/Timer';
import { ProgressBar } from '@/components/game/ProgressBar';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { submitGame } from '@/lib/api';

// Color mapping for display - improved colors for better visibility

const COLOR_MAP: Record<string, string> = {
  'red': '#DC2626',      // Better red (Tailwind red-600)
  'blue': '#2563EB',     // Better blue (Tailwind blue-600)
  'green': '#16A34A',    // Better green (Tailwind green-600)
  'teal': '#0D9488',     // Teal instead of cyan (Tailwind teal-600)
  'orange': '#EA580C',   // Better orange (Tailwind orange-600)
  'purple': '#9333EA',   // Better purple (Tailwind purple-600)
  'pink': '#DB2777',     // Pink for better visibility (Tailwind pink-600)
  'gray': '#6B7280'      // Better gray (Tailwind gray-500)
};

// Available colors for the game - removed yellow, replaced cyan with teal, added pink
const AVAILABLE_COLORS = ['red', 'blue', 'green', 'teal', 'orange', 'purple', 'pink', 'gray'];

// Generate tricky options based on task
const generateTrickyOptions = (
  word: string,
  fontColor: string,
  task: 'read_word' | 'name_color',
  randomFn: () => number
): Array<{ text: string; color: string }> => {
  const wordLower = word.toLowerCase();
  const fontColorLower = fontColor.toLowerCase();
  
  let options: Array<{ text: string; color: string }>;
  
  if (task === 'read_word') {
    // Task: Read the word (ignore color)
    // Example: "RED" in blue -> options: "red" (in red) and "blue" (in red)
    const correctText = wordLower;
    const wrongText = fontColorLower;
    
    // Both options shown in the word's color to confuse
    options = [
      { text: correctText, color: wordLower }, // Correct: "red" in red
      { text: wrongText, color: wordLower }   // Wrong: "blue" in red (tricky!)
    ];
  } else {
    // Task: Name the color (ignore word)
    // Example: "RED" in blue -> options: "Blue" (in red) and "Red" (in blue)
    const correctText = fontColorLower;
    const wrongText = wordLower;
    
    // Options shown in opposite colors to confuse
    options = [
      { text: correctText, color: wordLower }, // Correct: "blue" in red (tricky!)
      { text: wrongText, color: fontColorLower } // Wrong: "red" in blue (tricky!)
    ];
  }
  
  // Randomize order using seeded random
  return options.sort(() => randomFn() - 0.5);
};

// Generate questions - using a fixed seed for consistency
// In production, you might want to generate these server-side or use a seed
const generateQuestionsWithSeed = () => {
  // Use a fixed seed for consistent questions across sessions
  const seed = 12345;
  const questions = [];
  const words = ['RED', 'BLUE', 'GREEN', 'TEAL', 'ORANGE', 'PURPLE', 'PINK', 'GRAY'];
  
  // Simple seeded random function
  let seedValue = seed;
  const seededRandom = () => {
    seedValue = (seedValue * 9301 + 49297) % 233280;
    return seedValue / 233280;
  };
  
  for (let i = 0; i < 10; i++) {
    const word = words[Math.floor(seededRandom() * words.length)];
    const wordLower = word.toLowerCase();
    
    // Pick a different color for the font
    const availableFontColors = AVAILABLE_COLORS.filter(c => c !== wordLower);
    const fontColor = availableFontColors[Math.floor(seededRandom() * availableFontColors.length)];
    
    // Alternate between read_word and name_color tasks
    const task: 'read_word' | 'name_color' = i % 2 === 0 ? 'read_word' : 'name_color';
    
    // Determine correct answer
    const correctAnswer = task === 'read_word' ? wordLower : fontColor;
    
    // Generate tricky options
    const options = generateTrickyOptions(word, fontColor, task, seededRandom);
    
    // Check for interference (word and color don't match)
    const hasInterference = wordLower !== fontColor;
    
    questions.push({
      id: i + 1,
      word,
      fontColor,
      task,
      correctAnswer,
      options,
      interference: hasInterference,
      interferenceLevel: hasInterference ? 'high' : 'low'
    });
  }
  
  return questions;
};

// Generate questions once
const QUESTIONS = generateQuestionsWithSeed();

type GameState = 'instructions' | 'playing' | 'results';

const StroopTestStandard = () => {
  const [gameState, setGameState] = useState<GameState>('instructions');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<any[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const timePerQuestion = 5; // 5 seconds per question

  const startGame = () => {
    // Use hardcoded questions
    setCurrentQuestionIndex(0);
    setResponses([]);
    setGameState('playing');
    setQuestionStartTime(Date.now());
    setIsTimerRunning(true);
  };

  const handleAnswer = (answerText: string, answerColor: string) => {
    const question = QUESTIONS[currentQuestionIndex];
    const responseTime = Date.now() - questionStartTime;
    const isCorrect = answerText.toLowerCase() === question.correctAnswer.toLowerCase();

    // Find the option that was clicked
    const selectedOption = question.options.find(
      opt => opt.text.toLowerCase() === answerText.toLowerCase() && opt.color === answerColor
    );

    const response = {
      question_id: question.id,
      word_shown: question.word,
      font_color: COLOR_MAP[question.fontColor.toLowerCase()] || question.fontColor,
      task: question.task,
      option_1_text: question.options[0].text,
      option_1_color: COLOR_MAP[question.options[0].color.toLowerCase()] || question.options[0].color,
      option_2_text: question.options[1].text,
      option_2_color: COLOR_MAP[question.options[1].color.toLowerCase()] || question.options[1].color,
      correct_answer: question.correctAnswer,
      interference_level: question.interferenceLevel,
      user_answer: answerText,
      is_correct: isCorrect,
      response_time_ms: responseTime,
      max_allowed_time_ms: timePerQuestion * 1000,
      had_interference: question.interference || false,
      answered_at: new Date().toISOString()
    };

    const newResponses = [...responses, response];
    setResponses(newResponses);

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setQuestionStartTime(Date.now());
      setIsTimerRunning(true); // Restart timer
    } else {
      finishGame(newResponses);
    }
  };

  const handleTimeout = () => {
    const question = QUESTIONS[currentQuestionIndex];
    const response = {
      question_id: question.id,
      word_shown: question.word,
      font_color: COLOR_MAP[question.fontColor.toLowerCase()] || question.fontColor,
      task: question.task,
      option_1_text: question.options[0].text,
      option_1_color: COLOR_MAP[question.options[0].color.toLowerCase()] || question.options[0].color,
      option_2_text: question.options[1].text,
      option_2_color: COLOR_MAP[question.options[1].color.toLowerCase()] || question.options[1].color,
      correct_answer: question.correctAnswer,
      interference_level: question.interferenceLevel,
      user_answer: null,
      is_correct: false,
      response_time_ms: timePerQuestion * 1000,
      max_allowed_time_ms: timePerQuestion * 1000,
      had_interference: question.interference || false,
      answered_at: new Date().toISOString()
    };

    const newResponses = [...responses, response];
    setResponses(newResponses);

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setQuestionStartTime(Date.now());
      setIsTimerRunning(true); // Simply restart the timer
    } else {
      finishGame(newResponses);
    }
  };

  const finishGame = async (finalResponses: any[]) => {
    setIsTimerRunning(false);
    
    try {
      // Transform data to match backend's expected format
      // Backend may expect simplified format, but we send full data
      const raw_data = finalResponses.map(r => ({
        word: r.word_shown,
        color: r.font_color,
        user_response: r.user_answer,
        is_correct: r.is_correct,
        is_interference: r.had_interference,
        time_taken: r.response_time_ms / 1000,
        // Include all new fields for backend processing
        question_id: r.question_id,
        task: r.task,
        option_1_text: r.option_1_text,
        option_1_color: r.option_1_color,
        option_2_text: r.option_2_text,
        option_2_color: r.option_2_color,
        correct_answer: r.correct_answer,
        interference_level: r.interference_level,
        max_allowed_time_ms: r.max_allowed_time_ms,
        answered_at: r.answered_at
      }));
      
      // Submit to backend for scoring
      const result = await submitGame('stroop_test', raw_data);
      
      // Backend returns the full game result with scores
      if (result && result.scores) {
        setResult(result);
        setGameState('results');
      } else {
        console.error('Invalid result from backend:', result);
        alert('Failed to get scores. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting game:', error);
      alert('Failed to submit game. Please try again.');
    }
  };

  if (gameState === 'instructions') {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Eye className="w-6 h-6 text-primary" />
                Stroop Test - Standard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Instructions</h3>
                <p className="text-muted-foreground mb-4">
                  You will see words displayed in different colors. Your task will be either:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li><strong>Read the word</strong> - Select what the word says (ignore the color)</li>
                  <li><strong>Name the color</strong> - Select the color of the text (ignore the word)</li>
                </ul>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Game Details:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• {QUESTIONS.length} questions</li>
                  <li>• {timePerQuestion} seconds per question</li>
                  <li>• No feedback during the game</li>
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

  if (gameState === 'playing') {
    const question = QUESTIONS[currentQuestionIndex];
    return (
      <div className="container mx-auto px-6 py-8 min-h-screen flex items-center justify-center">
        <div className="max-w-2xl w-full space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  Stroop Test
                </CardTitle>
                <Timer
                  key={currentQuestionIndex} // Add key to force re-render and reset timer
                  isRunning={isTimerRunning}
                  initialTime={timePerQuestion}
                  countDown
                  maxTime={timePerQuestion}
                  onComplete={handleTimeout}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ProgressBar current={currentQuestionIndex + 1} total={QUESTIONS.length} />
              
              <div className="text-center space-y-4">
                <div className="text-sm font-medium text-muted-foreground">
                  {question.task === 'read_word' ? 'READ THE WORD' : 'NAME THE COLOR'}
                </div>
                
                <div className="py-12">
                  <div 
                    className="text-7xl font-bold drop-shadow-md"
                    style={{ 
                      color: COLOR_MAP[question.fontColor.toLowerCase()] || question.fontColor,
                      textShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      letterSpacing: '2px'
                    }}
                  >
                    {question.word}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {question.options.map((option, index) => {
                  const optionColor = COLOR_MAP[option.color.toLowerCase()] || option.color;
                  // Convert hex to rgba for shadow with safety check
                  const hexToRgba = (hex: string, alpha: number): string => {
                    if (!hex || !hex.startsWith('#')) {
                      return `rgba(0, 0, 0, ${alpha})`;
                    }
                    try {
                      const r = parseInt(hex.slice(1, 3), 16);
                      const g = parseInt(hex.slice(3, 5), 16);
                      const b = parseInt(hex.slice(5, 7), 16);
                      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                    } catch {
                      return `rgba(0, 0, 0, ${alpha})`;
                    }
                  };
                  const colorRgba = hexToRgba(optionColor, 0.15);
                  
                  return (
                    <Button
                      key={`${option.text}-${option.color}-${index}`}
                      onClick={() => handleAnswer(option.text, option.color)}
                      variant="outline"
                      size="lg"
                      className="h-28 text-2xl font-bold capitalize hover:scale-105 hover:shadow-xl active:scale-95 transition-all duration-200 bg-white dark:bg-gray-900 border-2 min-w-0"
                      style={{ 
                        color: optionColor,
                        borderColor: optionColor,
                        boxShadow: `0 4px 16px rgba(0, 0, 0, 0.1), inset 0 0 0 1px ${colorRgba}`
                      }}
                    >
                      <span 
                        className="block font-extrabold select-none"
                        style={{ 
                          letterSpacing: '2px',
                          filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1))'
                        }}
                      >
                        {option.text.toUpperCase()}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (gameState === 'results' && result) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <ScoreDisplay result={result} gameType="stroop_test" />
        </div>
      </div>
    );
  }

  return null;
};

export default StroopTestStandard;
