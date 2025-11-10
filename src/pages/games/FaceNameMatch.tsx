import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { submitGame, DEFAULT_USER_ID } from '@/lib/api';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { GameResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProgressBar } from '@/components/game/ProgressBar';
import { Timer } from '@/components/game/Timer';
import { Play, Users, Home } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface Face {
  id: string;
  full_name: string;
  image_url: string;
}

interface Attempt {
  face_id: string;
  presented_name: string;
  user_response: string;
  is_correct: boolean;
  time_taken: number;
  phase: 'learning' | 'recall';
}

type GamePhase = 'instructions' | 'learning' | 'testing' | 'loading' | 'results';
type Difficulty = 'easy' | 'medium';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Vite uses import.meta.env instead of process.env
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const GAME_TYPE = 'face_name_match';
const LEARNING_DISPLAY_TIME = 10000; // 10 seconds total
const TIME_PER_QUESTION = 10; // 10 seconds per question
const LEARNING_FACES_COUNT = 7; // Show 7 faces
const TEST_QUESTIONS_COUNT = 3; // Test on 3 faces from the 7

// Initialize Supabase client only if URL and key are available
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

// Debug: Log configuration (only in development)
if (import.meta.env.DEV) {
  console.log('Supabase Config:', {
    url: SUPABASE_URL ? `${SUPABASE_URL.substring(0, 20)}...` : 'NOT SET',
    hasKey: !!SUPABASE_ANON_KEY,
    keyLength: SUPABASE_ANON_KEY?.length || 0,
    keyPrefix: SUPABASE_ANON_KEY?.substring(0, 20) || 'NOT SET',
  });
}

// Mock user for development - uses user ID from env
type AuthUser = { id: string };
const useAuth = (): { user: AuthUser | null } => {
  return { user: { id: DEFAULT_USER_ID } };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const FaceNameMatch = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Game State
  const [phase, setPhase] = useState<GamePhase>('instructions');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [learningFaces, setLearningFaces] = useState<Face[]>([]);
  const [testFaces, setTestFaces] = useState<Face[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState<GameResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isLearningTimerRunning, setIsLearningTimerRunning] = useState(false);

  // ============================================================================
  // FETCH FACES FROM DATABASE
  // ============================================================================

  const fetchFaces = async () => {
    try {
      setPhase('loading');
      setError(null);

      if (!supabase) {
        const missingVars = [];
        if (!SUPABASE_URL) missingVars.push('VITE_SUPABASE_URL');
        if (!SUPABASE_ANON_KEY) missingVars.push('VITE_SUPABASE_ANON_KEY');
        throw new Error(
          `Supabase is not configured. Missing: ${missingVars.join(', ')}. ` +
          `Please create a .env file in the project root with:\n` +
          `VITE_SUPABASE_URL=https://your-project-id.supabase.co\n` +
          `VITE_SUPABASE_ANON_KEY=your-anon-key-here\n` +
          `\nGet these from: https://app.supabase.com/project/_/settings/api`
        );
      }

      // Debug: Test connection first
      console.log('Attempting to fetch from face_library table...');
      
      // Fetch all faces from the pool to get random selection
      const { data, error: fetchError } = await supabase
        .schema('public')
        .from('face_library')
        .select('*');

      if (fetchError) {
        console.error('Supabase error details:', {
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint,
          code: fetchError.code,
        });
        
        // Provide helpful error messages for common issues
        if (fetchError.code === 'PGRST301' || fetchError.message?.includes('permission denied') || fetchError.message?.includes('42501')) {
          throw new Error(
            `Permission denied accessing face_library table.\n\n` +
            `Even with RLS disabled, this error usually means:\n` +
            `1. You're using the WRONG API key:\n` +
            `   - Frontend MUST use "anon" or "public" key (starts with eyJ...)\n` +
            `   - Do NOT use service_role key in frontend\n` +
            `   - Get the correct key from: Settings → API → Project API keys → anon/public\n\n` +
            `2. Check table permissions:\n` +
            `   - Go to Table Editor → face_library → Settings\n` +
            `   - Ensure "Enable Row Level Security" is OFF\n` +
            `   - Check that the table is in the "public" schema\n\n` +
            `3. Verify table exists:\n` +
            `   - Go to Table Editor and confirm face_library table exists\n` +
            `   - Check table name spelling (case-sensitive)\n\n` +
            `Error code: ${fetchError.code}\n` +
            `Error: ${fetchError.message}`
          );
        } else if (fetchError.message?.includes('401') || fetchError.code === 'PGRST116') {
          throw new Error(
            `Authentication failed (401). Check that:\n` +
            `1. VITE_SUPABASE_ANON_KEY is the correct "anon" or "public" key\n` +
            `2. The key is from the same project as VITE_SUPABASE_URL\n` +
            `3. Your Supabase project is active (not paused)\n` +
            `4. No extra spaces or quotes in .env file\n\n` +
            `Error: ${fetchError.message}`
          );
        } else if (fetchError.code === '42P01') {
          throw new Error(
            `Table "face_library" does not exist.\n\n` +
            `Please create the table in Supabase:\n` +
            `1. Go to Table Editor\n` +
            `2. Click "New Table"\n` +
            `3. Name it "face_library"\n` +
            `4. Add columns: id (text), full_name (text), image_url (text)\n`
          );
        }
        throw new Error(fetchError.message || 'Unknown Supabase error');
      }
      
      if (!data || data.length < LEARNING_FACES_COUNT) {
        throw new Error(`Need at least ${LEARNING_FACES_COUNT} faces in database. Found ${data?.length || 0}.`);
      }

      // Shuffle all faces and randomly select LEARNING_FACES_COUNT
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      const selectedFaces = shuffled.slice(0, LEARNING_FACES_COUNT);
      setLearningFaces(selectedFaces);

      // Randomly select test questions from the selected learning faces
      const testSelection = [...selectedFaces]
        .sort(() => Math.random() - 0.5)
        .slice(0, TEST_QUESTIONS_COUNT);
      setTestFaces(testSelection);

      setPhase('learning');
    } catch (err) {
      console.error('Error fetching faces:', err);
      setError(err instanceof Error ? err.message : 'Failed to load faces');
      setPhase('instructions');
    }
  };

  // ============================================================================
  // START GAME
  // ============================================================================

  const startGame = (selectedDifficulty: Difficulty) => {
    setDifficulty(selectedDifficulty);
    fetchFaces();
    setAttempts([]);
    setUserInput('');
    setError(null);
  };

  // ============================================================================
  // LEARNING PHASE - AUTO ADVANCE AFTER 10 SECONDS
  // ============================================================================

  useEffect(() => {
    if (phase !== 'learning') return;

    // Start the learning timer
    setIsLearningTimerRunning(true);

    const timer = setTimeout(() => {
      setIsLearningTimerRunning(false);
      startTestPhase();
    }, LEARNING_DISPLAY_TIME);

    return () => {
      clearTimeout(timer);
      setIsLearningTimerRunning(false);
    };
  }, [phase]);

  // ============================================================================
  // TESTING PHASE TIMER (10 SECONDS PER QUESTION)
  // ============================================================================

  useEffect(() => {
    if (phase === 'testing' && testFaces.length > 0) {
      setQuestionStartTime(Date.now());
      setIsTimerRunning(true);
    }
  }, [phase, currentQuestionIndex, testFaces.length]);

  // ============================================================================
  // START TEST PHASE
  // ============================================================================

  const startTestPhase = () => {
    setCurrentQuestionIndex(0);
    setPhase('testing');
    setQuestionStartTime(Date.now());
  };

  // ============================================================================
  // HANDLE ANSWER
  // ============================================================================

  const handleAnswer = (selectedName: string, isTimeout: boolean = false) => {
    if (!questionStartTime || testFaces.length === 0) return;

    const timeTaken = (Date.now() - questionStartTime) / 1000;
    const currentFace = testFaces[currentQuestionIndex];
    
    const isCorrect = selectedName.toLowerCase().trim() === currentFace.full_name.toLowerCase().trim();

    const attempt: Attempt = {
      face_id: currentFace.id,
      presented_name: currentFace.full_name,
      user_response: selectedName || '(no answer)',
      is_correct: isCorrect,
      time_taken: timeTaken,
      phase: 'recall'
    };

    const newAttempts = [...attempts, attempt];
    setAttempts(newAttempts);
    setUserInput('');
    setIsTimerRunning(false);

    if (currentQuestionIndex < testFaces.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setQuestionStartTime(Date.now());
        setIsTimerRunning(true);
      }, 100);
    } else {
      submitGameData(newAttempts);
    }
  };

  const handleTimeout = () => {
    handleAnswer('', true);
  };

  // ============================================================================
  // SUBMIT TO BACKEND
  // ============================================================================

  const submitGameData = async (finalAttempts: Attempt[]) => {
    try {
      setPhase('loading');
      setError(null);

      const result = await submitGame('face_name_match', finalAttempts, user?.id);

      if (result && result.scores) {
        setScore(result);
        setPhase('results');
      } else {
        throw new Error('Invalid response from backend');
      }
    } catch (err) {
      console.error('Error submitting game:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit game';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
      setPhase('testing');
      setIsTimerRunning(true);
    }
  };

  // ============================================================================
  // RESTART GAME
  // ============================================================================

  const restartGame = () => {
    setPhase('instructions');
    setLearningFaces([]);
    setTestFaces([]);
    setAttempts([]);
    setCurrentQuestionIndex(0);
    setUserInput('');
    setScore(null);
    setError(null);
    setIsTimerRunning(false);
    setIsLearningTimerRunning(false);
    setQuestionStartTime(null);
  };

  // ============================================================================
  // GET DROPDOWN OPTIONS FOR EASY MODE
  // ============================================================================

  const getDropdownOptions = (): string[] => {
    const currentFace = testFaces[currentQuestionIndex];
    const correctName = currentFace.full_name;
    
    const otherNames = learningFaces
      .filter(f => f.full_name !== correctName)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(f => f.full_name);
    
    return [correctName, ...otherNames].sort(() => Math.random() - 0.5);
  };

  // ============================================================================
  // RENDER INSTRUCTIONS SCREEN
  // ============================================================================

  if (phase === 'instructions') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-3">👤 Face-Name Match</h1>
            <p className="text-gray-600">Test your memory by matching faces with names</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={() => startGame('easy')}
              className="w-full p-6 bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <div className="text-2xl font-bold mb-2">🟢 Easy Mode</div>
              <div className="text-sm opacity-90">Multiple choice - Select from dropdown</div>
            </button>

            <button
              onClick={() => startGame('medium')}
              className="w-full p-6 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <div className="text-2xl font-bold mb-2">🟠 Medium Mode</div>
              <div className="text-sm opacity-90">Type the name - No hints!</div>
            </button>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">How to Play:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>1️⃣ Learn: Study {LEARNING_FACES_COUNT} faces (10 seconds)</li>
              <li>2️⃣ Test: Match {TEST_QUESTIONS_COUNT} faces to their names</li>
              <li>3️⃣ Score: Get points for accuracy and speed</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER LOADING
  // ============================================================================

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER LEARNING PHASE
  // ============================================================================

  if (phase === 'learning' && learningFaces.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-5xl w-full">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Memorize These Faces!
            </h2>
            <p className="text-gray-600 mb-4">You have 10 seconds...</p>
            <div className="flex justify-center">
              <Timer
                isRunning={isLearningTimerRunning}
                initialTime={LEARNING_DISPLAY_TIME / 1000}
                countDown
                maxTime={LEARNING_DISPLAY_TIME / 1000}
              />
            </div>
          </div>

          {/* First row: 4 images */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            {learningFaces.slice(0, 4).map((face) => (
              <div key={face.id} className="text-center">
                <div className="w-full aspect-square rounded-xl overflow-hidden shadow-lg mb-2">
                  <img
                    src={face.image_url}
                    alt={face.full_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm font-semibold text-gray-800">{face.full_name}</p>
              </div>
            ))}
          </div>

          {/* Second row: 3 images */}
          <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
            {learningFaces.slice(4, 7).map((face) => (
              <div key={face.id} className="text-center">
                <div className="w-full aspect-square rounded-xl overflow-hidden shadow-lg mb-2">
                  <img
                    src={face.image_url}
                    alt={face.full_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm font-semibold text-gray-800">{face.full_name}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-center">
            <div className="flex space-x-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-4 h-4 bg-purple-400 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER TESTING PHASE
  // ============================================================================

  if (phase === 'testing' && testFaces.length > 0) {
    const currentFace = testFaces[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / testFaces.length) * 100;
    const dropdownOptions = difficulty === 'easy' ? getDropdownOptions() : [];

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-xl w-full">
          <div className="mb-6">
            <ProgressBar 
              current={currentQuestionIndex + 1} 
              total={testFaces.length}
              label={`Question ${currentQuestionIndex + 1} of ${testFaces.length}`}
            />
            <div className="mt-4 flex justify-center">
              <Timer
                isRunning={isTimerRunning}
                initialTime={TIME_PER_QUESTION}
                countDown
                maxTime={TIME_PER_QUESTION}
                onComplete={handleTimeout}
                key={currentQuestionIndex} // Reset timer for each question
              />
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="w-64 h-64 mx-auto mb-6 rounded-2xl overflow-hidden shadow-xl">
              <img
                src={currentFace.image_url}
                alt="Who is this?"
                className="w-full h-full object-cover"
              />
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              What is this person's name?
            </h2>
          </div>

          {difficulty === 'easy' && (
            <div className="space-y-4">
              <select
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                autoFocus
              >
                <option value="">-- Choose a name --</option>
                {dropdownOptions.map((name, idx) => (
                  <option key={idx} value={name}>
                    {name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => handleAnswer(userInput)}
                disabled={!userInput}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
              >
                Submit Answer
              </button>
            </div>
          )}

          {difficulty === 'medium' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (userInput.trim()) {
                  handleAnswer(userInput.trim());
                }
              }}
              className="space-y-4"
            >
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type the full name..."
                className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                autoFocus
              />

              <button
                type="submit"
                disabled={!userInput.trim()}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
              >
                Submit Answer
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-gray-500">
            Correct so far: {attempts.filter(a => a.is_correct).length} / {attempts.length}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER SCORE SCREEN
  // ============================================================================

  if (phase === 'results' && score) {
    return (
      <div className="min-h-screen bg-gradient-subtle p-6">
        <div className="max-w-4xl mx-auto">
          <ScoreDisplay result={score} gameType={GAME_TYPE} />
          <div className="mt-6 flex gap-4 justify-center">
            <Button onClick={restartGame} size="lg">
              <Play className="w-4 h-4 mr-2" />
              Play Again
            </Button>
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

export default FaceNameMatch;

