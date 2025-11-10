# NeuRazor Scoring Testbed - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Database Configuration](#database-configuration)
3. [Environment Setup](#environment-setup)
4. [API Endpoints](#api-endpoints)
5. [Game Implementations](#game-implementations)
6. [Screen Descriptions](#screen-descriptions)
7. [Scoring Configuration System](#scoring-configuration-system)
8. [Missing Configurations](#missing-configurations)
9. [File Structure](#file-structure)

---

## Project Overview

**NeuRazor Scoring Testbed** is a comprehensive platform for testing and refining cognitive assessment scoring algorithms. It allows users to:
- Play 11 different cognitive games
- View detailed scoring breakdowns
- Adjust scoring formulas, weights, and AI prompts in real-time
- Compare scores across different scoring versions
- Test how configuration changes affect scoring results

**Tech Stack:**
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn-ui
- **Backend**: Node.js, Express, Supabase (PostgreSQL)
- **State Management**: React Context API, React Query
- **Routing**: React Router DOM v6

---

## Database Configuration

### Supabase Database Structure

The backend uses Supabase (PostgreSQL) with the following tables:

#### 1. `scoring_versions` Table
Stores all scoring configurations for each game type with versioning support.

**Schema:**
```sql
CREATE TABLE scoring_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type VARCHAR(50) NOT NULL,
  version_name VARCHAR(10) NOT NULL,  -- V1, V2, V3, etc.
  description TEXT,
  is_active BOOLEAN DEFAULT false,
  config JSONB NOT NULL,  -- Full scoring configuration
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_type, version_name)
);
```

**Config JSONB Structure:**
```json
{
  "final_weights": {
    "accuracy": 0.4,
    "speed": 0.3,
    "quantitative_aptitude": 0.2,
    "mental_stamina": 0.1
  },
  "competency_formulas": {
    "accuracy_binary": "correct ? 100 : 0",
    "speed": "(time_limit - time_taken) / time_limit * 100"
  },
  "settings": {
    "accuracy_mode": "binary",
    "time_limit": 5
  },
  "ai_prompts": {  // Only for AI-scored games
    "reasoning": "Evaluate the user's logical reasoning...",
    "empathy": "Assess the user's emotional intelligence..."
  }
}
```

#### 2. `test_sessions` Table
Stores game session records with final scores.

**Schema:**
```sql
CREATE TABLE test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  game_type VARCHAR(50) NOT NULL,
  scoring_version_id UUID REFERENCES scoring_versions(id),
  status VARCHAR(20) DEFAULT 'in_progress',
  final_scores JSONB,  -- Calculated scores from backend
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);
```

**final_scores JSONB Structure:**
```json
{
  "final_score": 85.23,
  "competencies": {
    "accuracy": {
      "raw": 90.0,
      "weighted": 36.0,
      "weight": 0.4
    },
    "speed": {
      "raw": 58.0,
      "weighted": 17.4,
      "weight": 0.3
    }
  },
  "raw_stats": {
    "total_questions": 10,
    "correct_answers": 9,
    "total_time": 22.0
  }
}
```

#### 3. `action_receipts` Table
Stores raw game data for action-based games (Mental Math, Stroop, etc.).

**Schema:**
```sql
CREATE TABLE action_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES test_sessions(id) ON DELETE CASCADE,
  raw_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. `text_receipts` Table
Stores text responses for AI-scored games (Scenario Challenge, Creative Uses, etc.).

**Schema:**
```sql
CREATE TABLE text_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES test_sessions(id) ON DELETE CASCADE,
  response_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Database Functions

#### `get_next_version_name(p_game_type VARCHAR)`
Automatically generates the next version name (V1, V2, V3, etc.) for a game type.

**Usage:**
```sql
SELECT get_next_version_name('mental_math_sprint');  -- Returns 'V2' if V1 exists
```

### Row Level Security (RLS)

**Important:** The backend must use the **service_role key** (not anon key) to bypass RLS. All tables should have RLS policies that allow service_role full access.

---

## Environment Setup

### Frontend `.env` File

**Location:** `/.env` (root of frontend project)

**Required Variables:**
```env
VITE_API_BASE_URL=http://localhost:3000
```

**Note:** If `VITE_API_BASE_URL` is not set, it defaults to `http://localhost:3000`.

### Backend `.env` File

**Location:** Backend project root (separate from frontend)

**Required Variables:**
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # SERVICE ROLE KEY (not anon key!)
PORT=3000
GEMINI_API_KEY=your-gemini-api-key  # Optional, for AI scoring
```

**⚠️ CRITICAL:** 
- `SUPABASE_KEY` must be the **service_role key** from Supabase Dashboard
- Using the anon key will cause "permission denied" errors
- Service role key bypasses RLS and has full database access

### Default Test User

**User ID:** `53f77b43-d71a-4edf-8b80-c70b975264d8`

This is used as the default `user_id` when submitting games if no user is authenticated.

---

## API Endpoints

### Base URL
- **Local Development:** `http://localhost:3000`
- **Production:** (TBD)

### 1. Health Check
```
GET /health
```
**Response:**
```json
{
  "status": "ok",
  "message": "NeuRazor Backend is running"
}
```

### 2. Get Active Scoring Configuration
```
GET /api/scoring/active/:gameType
```
**Parameters:**
- `gameType` (path) - Game identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "game_type": "mental_math_sprint",
    "version_name": "V1",
    "description": "Original NeuRazor scoring formulas",
    "is_active": true,
    "config": {
      "final_weights": {...},
      "competency_formulas": {...},
      "settings": {...}
    },
    "created_at": "2025-01-15T10:00:00Z"
  }
}
```

### 3. Get All Scoring Versions
```
GET /api/scoring/versions/:gameType
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "version_name": "V2",
      "description": "Updated weights",
      "is_active": true,
      "created_at": "2025-01-15T11:00:00Z"
    },
    {
      "id": "uuid",
      "version_name": "V1",
      "description": "Original formulas",
      "is_active": false,
      "created_at": "2025-01-15T09:00:00Z"
    }
  ]
}
```

### 4. Save New Scoring Version
```
POST /api/scoring/save
```
**Request Body:**
```json
{
  "game_type": "mental_math_sprint",
  "user_id": "53f77b43-d71a-4edf-8b80-c70b975264d8",
  "description": "Increased speed importance",
  "config": {
    "final_weights": {...},
    "competency_formulas": {...},
    "settings": {...}
  }
}
```
**Response:**
```json
{
  "success": true,
  "message": "Saved as V2",
  "data": {
    "id": "uuid",
    "version_name": "V2",
    "is_active": true
  }
}
```
**Note:** Version name (V2, V3, etc.) is auto-generated by the backend.

### 5. Set Active Version
```
POST /api/scoring/set-active
```
**Request Body:**
```json
{
  "game_type": "mental_math_sprint",
  "version_name": "V1"
}
```
**Response:**
```json
{
  "success": true,
  "message": "V1 is now active",
  "data": {...}
}
```

### 6. Submit Game (Action-Based)
```
POST /api/games/submit
```
**Request Body:**
```json
{
  "game_type": "mental_math_sprint",
  "user_id": "53f77b43-d71a-4edf-8b80-c70b975264d8",
  "raw_data": [
    {
      "problem": "5 + 3",
      "user_answer": 8,
      "correct_answer": 8,
      "is_correct": true,
      "time_taken": 2.1
    }
  ]
}
```
**Response:**
```json
{
  "success": true,
  "message": "Game submitted successfully",
  "data": {
    "session_id": "uuid",
    "version_used": "V1",
    "scores": {
      "final_score": 85.23,
      "competencies": {...},
      "raw_stats": {...}
    }
  }
}
```

### 7. Submit AI Game
```
POST /api/ai/submit-game
```
**Request Body:**
```json
{
  "game_type": "scenario_challenge",
  "user_id": "53f77b43-d71a-4edf-8b80-c70b975264d8",
  "response_data": {
    "scenario_text": "Raj interrupted Asha...",
    "question_text": "What might Asha be feeling?",
    "response_text": "Asha is likely feeling frustrated...",
    "time_taken": 45.2
  }
}
```
**Response:**
```json
{
  "success": true,
  "message": "AI game submitted successfully",
  "data": {
    "session_id": "uuid",
    "version_used": "V1",
    "ai_scores": {
      "reasoning": 82,
      "empathy": 88,
      "feedback": "Strong empathy shown..."
    },
    "final_scores": {
      "final_score": 81.5,
      "competencies": {...}
    }
  }
}
```

### 8. Get AI Scores Only (Preview)
```
POST /api/ai/score
```
**Request Body:**
```json
{
  "game_type": "scenario_challenge",
  "response_data": {
    "scenario_text": "...",
    "response_text": "..."
  }
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "ai_scores": {
      "reasoning": 82,
      "empathy": 88
    },
    "version_used": "V1"
  }
}
```
**Note:** This doesn't save to database, only returns AI evaluation.

### 9. Get Results History
```
GET /api/games/results/:gameType?userId=xxx
```
**Parameters:**
- `gameType` (path) - Game identifier
- `userId` (query, optional) - Filter by user

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "session-1",
      "final_scores": {...},
      "created_at": "2025-01-15T10:00:00Z",
      "completed_at": "2025-01-15T10:05:00Z",
      "scoring_version": {
        "version_name": "V1"
      }
    }
  ]
}
```

---

## Game Implementations

### Valid Game Types

The backend recognizes these exact game type strings:

1. `mental_math_sprint` ✅ Implemented
2. `stroop_test` ✅ Implemented
3. `sign_sudoku` ✅ Implemented (as PatternSudoku)
4. `face_name_match` ❌ Not Implemented (UI placeholder only)
5. `card_flip_challenge` ❌ Not Implemented (UI placeholder only)
6. `scenario_challenge` ✅ Implemented
7. `ai_debate` ❌ Not Implemented (UI placeholder only)
8. `creative_uses` ✅ Implemented
9. `statement_reasoning` ❌ Not Implemented
10. `vocab_challenge` ❌ Not Implemented
11. `lucky_flip` ❌ Not Implemented

---

### 1. Mental Math Sprint ✅

**Route:** `/games/mental-math-easy`  
**Component:** `src/pages/games/MentalMathEasy.tsx`  
**Backend Game Type:** `mental_math_sprint`

#### Game Flow:
1. **Instructions Screen** → Shows game rules and details
2. **Start Button** → User clicks to begin
3. **Playing State** → 10 math problems, 5 seconds each
4. **Results Screen** → Shows score breakdown

#### Timer Configuration:
- **Per Question:** 5 seconds
- **Timer Resets:** Yes, for each question (using `key={currentProblem}`)
- **Time Tracking:** Records `time_taken` for each question

#### Data Submission Format:
```javascript
{
  game_type: "mental_math_sprint",
  user_id: "uuid",
  raw_data: [
    {
      problem: "103 - 9",
      user_answer: 94,
      correct_answer: 94,
      is_correct: true,
      time_taken: 2.1  // seconds
    },
    // ... 9 more problems
  ]
}
```

#### Competencies Tested:
- Accuracy (40% weight)
- Speed (30% weight)
- Quantitative Aptitude (20% weight)
- Mental Stamina (10% weight)

#### Scoring Logic (Backend):
- **Accuracy:** Binary mode (100 or 0) or graded based on error percentage
- **Speed:** `(time_limit - avg_time) / time_limit * 100`
- **Quantitative Aptitude:** `(accuracy * 0.7) + (speed * 0.3)`
- **Mental Stamina:** Based on speed consistency (lower std dev = higher score)

---

### 2. Stroop Test ✅

**Route:** `/games/stroop-test-standard`  
**Component:** `src/pages/games/StroopTestStandard.tsx`  
**Backend Game Type:** `stroop_test`

#### Game Flow:
1. **Instructions Screen** → Explains word/color task
2. **Start Button** → User clicks to begin
3. **Playing State** → 10 questions, 3 seconds each
4. **Results Screen** → Shows score breakdown

#### Timer Configuration:
- **Per Item:** 3 seconds
- **Timer Resets:** Yes, for each item (using `key={currentQuestionIndex}`)
- **Time Tracking:** Records `time_taken` for each response

#### Data Submission Format:
```javascript
{
  game_type: "stroop_test",
  user_id: "uuid",
  raw_data: [
    {
      word: "RED",
      color: "#0000FF",  // blue
      user_response: "blue",
      is_correct: true,
      is_interference: true,  // word != color
      time_taken: 1.8  // seconds
    },
    // ... 9 more items
  ]
}
```

#### Competencies Tested:
- Cognitive Flexibility (30% weight)
- Cognitive Agility (30% weight)
- Accuracy (20% weight)
- Speed (20% weight)

#### Scoring Logic (Backend):
- **Accuracy:** `(correct / total) * 100`
- **Speed:** `100 - ((avg_time / max_time) * 40)`
- **Cognitive Agility:** `(accuracy * 0.6) + (speed * 0.4)`
- **Cognitive Flexibility:** Penalty for errors on interference items

---

### 3. Sign Sudoku / Pattern Sudoku ✅

**Route:** `/games/pattern-sudoku`  
**Component:** `src/pages/games/PatternSudoku.tsx`  
**Backend Game Type:** `sign_sudoku`

#### Game Flow:
1. **Welcome Screen** → Choose difficulty (Easy/Medium/Hard)
2. **Playing State** → Fill grid with patterns, single timer for entire game
3. **Results Screen** → Shows score breakdown

#### Timer Configuration:
- **Game Timer:** 60s (Easy), 90s (Medium), 120s (Hard)
- **Single Timer:** For entire game (not per cell)
- **Time Tracking:** Records `time_left_sec` and `total_time_allowed`

#### Data Submission Format:
```javascript
{
  game_type: "sign_sudoku",
  user_id: "uuid",
  raw_data: {
    correct_entries: 12,
    incorrect_entries: 2,
    total_empty_cells: 16,
    time_left_sec: 45,
    total_time_allowed: 60,
    total_attempts: 18,
    avg_time_per_correct_entry: 8.5,
    completion_status: "partial",  // or "completed"
    grid_size: 4,
    difficulty_multiplier: 1.0,  // 1.0 (easy), 1.5 (medium), 2.0 (hard)
    correct_first_attempts: 10
  }
}
```

#### Competencies Tested:
- Accuracy (weight varies)
- Reasoning (weight varies)
- Attention to Detail (weight varies)
- Speed (weight varies)
- Math (weight varies)

#### Scoring Logic (Backend):
- **Accuracy:** `((correct_entries / total_empty) * 100) - (incorrect_entries * penalty)`
- **Reasoning:** `((correct_entries / total_attempts) * 100) * difficulty_multiplier`
- **Speed:** `(time_left / total_time * 50) + (50 / (avg_time_per_correct + 1))`
- **Attention to Detail:** `(accuracy * 0.6) + (correct_first_attempts / total_empty * 40)`

---

### 4. Scenario Challenge ✅

**Route:** `/games/scenario-challenge`  
**Component:** `src/pages/games/ScenarioChallenge.tsx`  
**Backend Game Type:** `scenario_challenge`

#### Game Flow:
1. **Instructions Screen** → Shows scenario description
2. **Start Button** → User clicks to begin
3. **Question Screen** → Multiple questions, 2 minutes each
4. **Results Screen** → Shows AI-evaluated scores

#### Timer Configuration:
- **Per Question:** 120 seconds (2 minutes)
- **Timer Resets:** Yes, for each question (using `key={currentQuestionIndex}`)
- **Time Tracking:** Records `time_taken` for each response

#### Data Submission Format:
```javascript
{
  game_type: "scenario_challenge",
  user_id: "uuid",
  response_data: {
    scenario_text: "You overhear a disagreement...",
    question_text: "What are the potential underlying reasons?",
    response_text: "User's detailed response...",
    response_length: 250,
    time_taken: 45.2  // seconds
  }
}
```

#### Competencies Tested (AI-Evaluated):
- Reasoning
- Decision Making
- Empathy
- Creativity
- Communication

#### Scoring Logic:
- **AI Evaluation:** Uses Google Gemini API (or mock if no API key)
- **Final Score:** Weighted sum of AI competency scores

---

### 5. Creative Uses ✅

**Route:** `/games/creative-uses`  
**Component:** `src/pages/games/CreativeUses.tsx`  
**Backend Game Type:** `creative_uses`

#### Game Flow:
1. **Instructions Screen** → Shows object name
2. **Start Button** → User clicks to begin
3. **Playing State** → 60 seconds to list creative uses
4. **Results Screen** → Shows AI-evaluated scores

#### Timer Configuration:
- **Game Timer:** 60 seconds total
- **Single Timer:** For entire game
- **Time Tracking:** Records `time_taken` from start to finish

#### Data Submission Format:
```javascript
{
  game_type: "creative_uses",
  user_id: "uuid",
  response_data: {
    object_name: "Brick",
    uses: [
      "Use as bookmark",
      "Unlock small locks",
      "Reset electronics"
    ],
    time_taken: 55.3,  // seconds
    time_limit: 60
  }
}
```

#### Competencies Tested (AI-Evaluated):
- Creativity (70% weight) - Originality, diversity
- Speed (30% weight) - Based on number of uses per time

---

### 6. Interview Challenge ✅

**Route:** `/games/interview`  
**Component:** `src/pages/games/Interview.tsx`  
**Backend Game Type:** Uses `scenario_challenge` for submission

#### Game Flow:
1. **Instructions Screen** → Shows interview format
2. **Start Button** → User clicks to begin
3. **Question Screen** → 4 questions, 5 minutes each
4. **Results Screen** → Shows AI-evaluated scores

#### Timer Configuration:
- **Per Question:** 300 seconds (5 minutes)
- **Timer Resets:** Yes, for each question
- **Time Tracking:** Records `time_taken` for each response

#### Data Submission Format:
```javascript
{
  game_type: "scenario_challenge",  // Note: Uses scenario_challenge type
  user_id: "uuid",
  response_data: {
    scenario_text: "Interview Question",
    question_text: "Tell me about a time you failed...",
    response_text: "User's answer...",
    response_length: 180,
    time_taken: 120.5  // seconds
  }
}
```

#### Competencies Tested (AI-Evaluated):
- Resilience
- Leadership
- Growth Mindset
- Problem-Solving

---

### 7. Face-Name Match ❌

**Route:** `/games/face-name-match-easy`  
**Component:** `src/pages/games/FaceNameMatchEasy.tsx`  
**Backend Game Type:** `face_name_match`

#### Status: **NOT IMPLEMENTED**
- Only shows placeholder: "Game implementation coming soon..."
- Backend supports this game type
- UI needs to be built

#### Expected Data Format (from backend docs):
```javascript
{
  game_type: "face_name_match",
  user_id: "uuid",
  raw_data: [
    {
      face_id: "uuid",
      presented_name: "John Doe",
      user_response: "John Doe",
      is_correct: true,
      time_taken: 3.2,
      phase: "learning"  // or "recall"
    }
  ]
}
```

#### Competencies (from backend):
- Memory
- Accuracy
- Speed

---

### 8. Card Flip Challenge ❌

**Route:** `/games/card-flip-easy`  
**Component:** `src/pages/games/CardFlipEasy.tsx`  
**Backend Game Type:** `card_flip_challenge`

#### Status: **NOT IMPLEMENTED**
- Only shows placeholder: "Game implementation coming soon..."
- Backend supports this game type
- UI needs to be built

#### Expected Data Format (from backend docs):
```javascript
{
  game_type: "card_flip_challenge",
  user_id: "uuid",
  raw_data: {
    correct_pairs: 8,
    total_pairs: 10,
    total_flips: 25,
    minimum_flips: 20,
    time_taken: 45.3,
    time_limit: 60,
    pattern_discovered: true
  }
}
```

#### Competencies (from backend):
- Pattern Recognition
- Reasoning
- Strategy
- Speed

---

### 9. Debate Mode (AI Debate) ❌

**Route:** `/games/debate-mode`  
**Component:** `src/pages/games/DebateMode.tsx`  
**Backend Game Type:** `ai_debate`

#### Status: **NOT IMPLEMENTED**
- Only shows placeholder: "Game implementation coming soon..."
- Backend supports this game type
- UI needs to be built

#### Expected Data Format (from backend docs):
```javascript
{
  game_type: "ai_debate",
  user_id: "uuid",
  response_data: {
    debate_statement: "Social media does more harm than good",
    pros_text: "User's pros argument...",
    cons_text: "User's cons argument...",
    num_points_pros: 5,
    num_points_cons: 5
  }
}
```

#### Competencies (from backend):
- Reasoning
- Holistic Analysis
- Cognitive Agility
- Communication

---

### 10. Statement Reasoning ❌

**Route:** Not created  
**Component:** Not created  
**Backend Game Type:** `statement_reasoning`

#### Status: **NOT IMPLEMENTED**
- No UI component exists
- Backend supports this game type
- Needs complete implementation

#### Expected Data Format (from backend docs):
```javascript
{
  game_type: "statement_reasoning",
  user_id: "uuid",
  response_data: {
    statements: ["Statement 1", "Statement 2", "Statement 3"],
    response_text: "User's explanation of connection...",
    response_length: 180
  }
}
```

---

### 11. Vocab Challenge ❌

**Route:** Not created  
**Component:** Not created  
**Backend Game Type:** `vocab_challenge`

#### Status: **NOT IMPLEMENTED**
- No UI component exists
- Backend supports this game type
- Needs complete implementation

#### Expected Data Format (from backend docs):
```javascript
{
  game_type: "vocab_challenge",
  user_id: "uuid",
  raw_data: {
    unique_valid_words: 25,
    total_words_entered: 30,
    time_taken: 58,
    time_limit: 60
  }
}
```

#### Competencies (from backend):
- Vocabulary
- Speed

---

### 12. Lucky Flip ❌

**Route:** Not created  
**Component:** Not created  
**Backend Game Type:** `lucky_flip`

#### Status: **NOT IMPLEMENTED**
- No UI component exists
- Backend supports this game type
- Needs complete implementation

#### Expected Data Format (from backend docs):
```javascript
{
  game_type: "lucky_flip",
  user_id: "uuid",
  raw_data: {
    rounds_completed: 8,
    total_rounds: 10,
    times_went_bust: 2,
    voluntary_stops_at_optimal_points: 3,
    final_credits: 250,
    starting_credits: 100,
    decision_history: [...]
  }
}
```

#### Competencies (from backend):
- Risk Appetite (AI-evaluated)
- Drive
- Reasoning (AI-evaluated)

---

## Screen Descriptions

### 1. Home Screen (`/`)

**Component:** `src/pages/Index.tsx`

**Layout:**
- **Hero Section:** NeuRazor logo, title, description
- **Key Features Cards:** 3 cards showing main features
- **How to Use Section:** 5-step guide
- **Available Games Grid:** 8 game cards with "Try It" buttons

**Features:**
- Links to all implemented games
- Overview of platform capabilities
- Visual design with gradient backgrounds

---

### 2. Sidebar Navigation

**Component:** `src/components/Sidebar.tsx`

**Layout:**
- **Header:** NeuRazor logo and title
- **Home Link:** Returns to home page
- **Games List:** 10 game links with icons
- **Footer:** "Scoring Controls" button

**Games Listed:**
1. Mental Math Sprint
2. Face-Name Match
3. Sign Sudoku
4. Stroop Test
5. Card Flip Challenge
6. Scenario Challenge
7. Debate Mode
8. Creative Uses
9. Interview Assessment
10. Pattern Sudoku

**Active State:** Highlighted with accent background

---

### 3. Game Instruction Screens

**Implemented Games:**
- ✅ Mental Math Sprint
- ✅ Stroop Test
- ✅ Creative Uses
- ✅ Interview Challenge
- ✅ Scenario Challenge
- ✅ Pattern Sudoku (Welcome/Difficulty Selection)

**Common Elements:**
- Game title and icon
- Instructions text
- Game details (time limits, number of questions, etc.)
- **Start Game** button

**Purpose:** Allows users to read rules before starting

---

### 4. Game Playing Screens

#### Mental Math Sprint
- **Layout:** Card with timer, progress bar, problem display, input field
- **Timer:** Countdown from 5 seconds per question
- **Progress:** Shows "Question X of 10"
- **Input:** Number input with auto-focus
- **Submit:** Button to submit answer

#### Stroop Test
- **Layout:** Card with timer, progress bar, word display, option buttons
- **Timer:** Countdown from 3 seconds per item
- **Display:** Large colored word
- **Task Indicator:** "READ THE WORD" or "NAME THE COLOR"
- **Options:** 2 buttons for answer choices

#### Creative Uses
- **Layout:** Card with timer, object name, input field, use list
- **Timer:** Countdown from 60 seconds total
- **Input:** Text input to add uses
- **List:** Shows all entered uses
- **Finish:** Button to submit early

#### Interview Challenge
- **Layout:** Card with timer, question text, textarea
- **Timer:** Countdown from 5 minutes per question
- **Question Counter:** "Question X of 4"
- **Textarea:** Large text input for answer
- **Button:** "Next Question" or "Finish & Submit"

#### Scenario Challenge
- **Layout:** Card with timer, scenario description, question text, textarea
- **Timer:** Countdown from 2 minutes per question
- **Question Counter:** "Question X of 4"
- **Textarea:** Large text input for response
- **Button:** "Submit and Go to Next Question" or "Finish & Submit"

#### Pattern Sudoku
- **Layout:** Grid of cells, pattern buttons, difficulty selector
- **Timer:** Countdown for entire game (60s/90s/120s)
- **Grid:** Clickable cells (fixed cells disabled)
- **Patterns:** Buttons to select pattern
- **Finish:** Button to submit early

---

### 5. Score Display Screen

**Component:** `src/components/ScoreDisplay.tsx`

**Layout:**
- **Final Score Card:**
  - Large score number (0-100)
  - Score label (Exceptional, Excellent, etc.)
  - Game name and difficulty
  - Scoring version used

- **Competency Breakdown Card:**
  - List of competencies with:
    - Competency name
    - Raw score
    - Weight percentage
    - Weighted score
    - Progress bar
  - Summary table showing:
    - Competency
    - Raw Score
    - Weight
    - Contribution
    - Total final score

**Score Color Coding:**
- ≥80: Green (success)
- ≥60: Blue (primary)
- ≥40: Yellow (accent)
- <40: Red (destructive)

**Score Labels:**
- ≥90: Exceptional
- ≥80: Excellent
- ≥70: Very Good
- ≥60: Good
- ≥50: Average
- <50: Needs Improvement

---

### 6. Scoring Controls Modal

**Component:** `src/components/ScoringControlsModal.tsx`

**Layout:**
- **Modal Dialog:** Large modal (max-w-4xl)
- **Tabs:** One tab per game type
- **Scrollable Content:** Configurable sections

**Tabs Available:**
1. Mental Math
2. Stroop Test
3. Sign Sudoku
4. Face-Name
5. Card Flip
6. Scenario
7. Debate
8. Creative Uses

**Configurable Sections (per game):**

1. **Final Weights:**
   - Input fields for each competency weight
   - Values must sum to 1.0
   - Number inputs with step 0.01

2. **Competency Formulas:**
   - Textarea for each formula
   - Display-only (backend calculates)
   - Shows formula strings

3. **AI Prompts:**
   - Textarea for each AI prompt
   - Only for AI-scored games
   - Used by Gemini API

4. **Settings:**
   - Game-specific settings
   - Examples: `accuracy_mode`, `time_limit`
   - Number or text inputs

5. **Available Variables:**
   - Display-only section
   - Shows variables available in formulas

**Actions:**
- **Save New Version:** Creates V2, V3, etc. automatically
- **Cancel:** Closes without saving

**Behavior:**
- Loads active config from backend on open
- Falls back to defaults if backend unavailable
- Shows toast notifications for success/error

---

### 7. NotFound Screen

**Component:** `src/pages/NotFound.tsx`

**Layout:**
- 404 message
- Link back to home

---

## Scoring Configuration System

### Context Provider

**Component:** `src/context/ScoringConfigContext.tsx`

**Purpose:** Manages scoring configuration state across the app

**State:**
- `config`: Record of game types to their configs
- `loading`: Loading state
- `error`: Error message

**Functions:**
- `loadGameConfig(gameType)`: Loads active config from backend
- `updateConfig(gameType, newConfig, description, userId)`: Saves new version

**Default User ID:** `53f77b43-d71a-4edf-8b80-c70b975264d8`

---

### Version Management

**How It Works:**
1. User opens Scoring Controls modal
2. System loads active version (V1, V2, etc.) from backend
3. User edits weights/formulas/prompts
4. User clicks "Save New Version"
5. Backend automatically:
   - Deactivates current version
   - Creates new version (V2, V3, etc.)
   - Sets new version as active
6. All future games use new version

**Version Naming:**
- Auto-generated: V1, V2, V3, etc.
- User cannot set version name
- Backend function `get_next_version_name()` handles this

---

## Missing Configurations

### 1. Database Setup

**Status:** ⚠️ **REQUIRED**

**Missing:**
- Tables may not exist in Supabase
- RLS policies may not be configured
- Default V1 configurations may not be inserted

**Action Required:**
- Run SQL setup script in Supabase SQL Editor
- Or manually create tables and insert default configs

---

### 2. Backend Environment

**Status:** ⚠️ **REQUIRED**

**Missing:**
- `.env` file in backend may not have correct keys
- Service role key may not be set
- Port may not match frontend expectation (3000)

**Action Required:**
- Verify `SUPABASE_KEY` is service_role key (not anon)
- Set `PORT=3000` in backend `.env`
- Restart backend server

---

### 3. AI Scoring Configuration

**Status:** ⚠️ **OPTIONAL**

**Missing:**
- `GEMINI_API_KEY` may not be set in backend
- AI games will use mock scores if not configured

**Action Required:**
- Get API key from Google AI Studio
- Add to backend `.env`: `GEMINI_API_KEY=your-key`
- Restart backend

**Impact:**
- Without key: AI games use random 60-90 scores
- With key: Real AI evaluation via Gemini API

---

### 4. Unimplemented Games

**Status:** ❌ **NOT IMPLEMENTED**

**Games Needing UI:**
1. **Face-Name Match** - Placeholder only
2. **Card Flip Challenge** - Placeholder only
3. **Debate Mode** - Placeholder only
4. **Statement Reasoning** - No component
5. **Vocab Challenge** - No component
6. **Lucky Flip** - No component

**Action Required:**
- Create game components following existing patterns
- Add routes to `App.tsx`
- Add links to `Sidebar.tsx`
- Implement timer logic (per-question or game-wide)
- Implement data collection
- Connect to backend API

---

### 5. Game Content Endpoint

**Status:** ⚠️ **MOCK DATA**

**Missing:**
- Backend endpoint `/api/games/content/:gameType` doesn't exist
- Frontend uses mock data in `getGameContent()`

**Current Mock Data:**
- `scenario_challenge`: Office conflict scenario
- `creative_uses`: Object name "Brick"
- `interview`: 4 interview questions

**Action Required:**
- Create backend endpoint to serve game content
- Or move content to frontend data files
- Update `getGameContent()` to use real endpoint

---

### 6. Authentication System

**Status:** ⚠️ **MOCK**

**Missing:**
- Real authentication not implemented
- All games use mock `useAuth()` hook
- Returns hardcoded user ID

**Current Implementation:**
```typescript
const useAuth = (): { user: AuthUser | null } => {
    return { user: { id: 'test-user-id' } };
};
```

**Action Required:**
- Implement Supabase Auth
- Add login/signup screens
- Replace mock hooks with real auth
- Pass real user ID to API calls

---

### 7. Results History View

**Status:** ⚠️ **API EXISTS, UI MISSING**

**Missing:**
- No UI component to view results history
- API endpoint exists: `GET /api/games/results/:gameType`

**Action Required:**
- Create results history component
- Add route (e.g., `/games/:gameType/history`)
- Display table/list of past results
- Show version comparison
- Add filters (by user, date range, version)

---

### 8. Version Comparison View

**Status:** ❌ **NOT IMPLEMENTED**

**Missing:**
- No UI to compare scores across versions
- Backend supports this via results history

**Action Required:**
- Create version comparison component
- Fetch results for different versions
- Display side-by-side comparison
- Show score differences

---

### 9. Error Handling UI

**Status:** ⚠️ **PARTIAL**

**Current:**
- Basic error handling in API calls
- Console errors logged
- Some games show alerts

**Missing:**
- Global error boundary
- User-friendly error messages
- Retry mechanisms
- Network error handling

---

### 10. Loading States

**Status:** ⚠️ **PARTIAL**

**Current:**
- Some games show loading spinners
- Score submission shows "Calculating..."

**Missing:**
- Consistent loading patterns
- Skeleton loaders
- Progress indicators for long operations

---

## File Structure

```
neu-score-hub-main/
├── public/
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── game/
│   │   │   ├── ProgressBar.tsx      # Progress indicator
│   │   │   └── Timer.tsx            # Countdown timer component
│   │   ├── ui/                      # shadcn-ui components (50+ files)
│   │   ├── NavLink.tsx
│   │   ├── ScoreDisplay.tsx         # Score results display
│   │   ├── ScoringControlsModal.tsx # Scoring configuration UI
│   │   └── Sidebar.tsx               # Navigation sidebar
│   ├── context/
│   │   └── ScoringConfigContext.tsx # Scoring config state management
│   ├── data/
│   │   ├── creativeUsesQuestions.ts
│   │   ├── scenarioQuestions.ts
│   │   └── sudokuQuestions.ts       # Pattern Sudoku puzzles
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── lib/
│   │   ├── api.ts                   # All API client functions
│   │   ├── transformers.ts          # Backend response transformers
│   │   ├── types.ts                 # TypeScript type definitions
│   │   └── utils.ts                 # Utility functions
│   ├── pages/
│   │   ├── games/
│   │   │   ├── CardFlipEasy.tsx     # ❌ Not implemented
│   │   │   ├── CreativeUses.tsx      # ✅ Implemented
│   │   │   ├── DebateMode.tsx      # ❌ Not implemented
│   │   │   ├── FaceNameMatchEasy.tsx # ❌ Not implemented
│   │   │   ├── Interview.tsx        # ✅ Implemented
│   │   │   ├── MentalMathEasy.tsx   # ✅ Implemented
│   │   │   ├── PatternSudoku.tsx    # ✅ Implemented
│   │   │   ├── ScenarioChallenge.tsx # ✅ Implemented
│   │   │   ├── SignSudokuEasy.tsx   # ❌ Not implemented
│   │   │   └── StroopTestStandard.tsx # ✅ Implemented
│   │   ├── Index.tsx                # Home page
│   │   └── NotFound.tsx             # 404 page
│   ├── App.tsx                      # Main app component, routes
│   ├── App.css
│   ├── index.css                    # Global styles
│   ├── main.tsx                     # Entry point
│   └── vite-env.d.ts               # Vite environment types
├── .env                             # Environment variables (gitignored)
├── .gitignore
├── components.json                  # shadcn-ui config
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## API Client Functions

**File:** `src/lib/api.ts`

### Available Functions:

1. **`submitGame(gameType, rawData, userId?)`**
   - Submits action-based games
   - Returns: `{ session_id, version_used, scores }`

2. **`submitAIGame(gameType, responseData, userId?)`**
   - Submits AI-scored games
   - Returns: `{ session_id, version_used, ai_scores, final_scores }`

3. **`getAIScores(gameType, responseData)`**
   - Preview AI scores without saving
   - Returns: `{ ai_scores, version_used }`

4. **`loadActiveGameConfig(gameType)`**
   - Gets active scoring configuration
   - Returns: Config object

5. **`getAllScoringVersions(gameType)`**
   - Gets all versions for a game
   - Returns: Array of version objects

6. **`setActiveVersion(gameType, versionName)`**
   - Sets a version as active
   - Returns: Version object

7. **`saveNewGameConfig(gameType, config, description?, userId?)`**
   - Saves new scoring version
   - Returns: New version object

8. **`getResultsHistory(gameType, userId?)`**
   - Gets past results
   - Returns: Array of session objects

9. **`getGameContent(gameType)`**
   - Gets game content (currently mock)
   - Returns: Game content object

---

## Key Configuration Points

### Timer Reset Logic

**Per-Question Games:**
- Mental Math: `key={currentProblem}` on Timer
- Stroop Test: `key={currentQuestionIndex}` on Timer
- Scenario Challenge: `key={currentQuestionIndex}` on Timer
- Interview: `key={currentQuestionIndex}` on Timer

**Game-Wide Timer:**
- Creative Uses: Single 60s timer
- Pattern Sudoku: Single timer (60s/90s/120s)

### State Management

**Game State Patterns:**
- `'instructions' | 'playing' | 'results'` (Mental Math, Stroop)
- `'welcome' | 'playing' | 'results'` (Pattern Sudoku)
- `loading | playing | finished` (Creative Uses, Interview, Scenario)

### Error Handling

**Current Pattern:**
- Try/catch blocks in async functions
- Console error logging
- Alert messages for user feedback
- Validation of backend responses before setting state

---

## Testing Checklist

### Backend Connection
- [ ] Backend running on port 3000
- [ ] Health check endpoint responds
- [ ] Supabase connection working (service_role key)
- [ ] Tables exist in database

### Game Functionality
- [ ] Mental Math: Start → Play → Score display
- [ ] Stroop Test: Start → Play → Score display
- [ ] Creative Uses: Start → Play → Score display
- [ ] Interview: Start → Next button works → Score display
- [ ] Scenario: Start → Next button works → Score display
- [ ] Pattern Sudoku: Difficulty selection → Play → Score display

### Scoring System
- [ ] Scoring Controls modal opens
- [ ] Config loads from backend
- Save creates new version
- [ ] Version name auto-generated correctly

### Data Flow
- [ ] Games submit correct data format
- [ ] Backend returns scores
- [ ] ScoreDisplay shows results correctly
- [ ] Version information displayed

---

## Next Steps / Recommendations

1. **Complete Unimplemented Games:**
   - Start with Face-Name Match (simpler than others)
   - Then Card Flip Challenge
   - Then AI games (Debate, Statement Reasoning)

2. **Add Results History UI:**
   - Create history view component
   - Add route and navigation
   - Implement version comparison

3. **Improve Error Handling:**
   - Add error boundary
   - Better user feedback
   - Retry mechanisms

4. **Add Authentication:**
   - Implement Supabase Auth
   - Replace mock hooks
   - Add login/signup screens

5. **Database Setup:**
   - Verify all tables exist
   - Insert default V1 configs
   - Test RLS policies

---

## Support & Troubleshooting

### Common Issues

1. **"Permission denied for table scoring_versions"**
   - **Cause:** Using anon key instead of service_role key
   - **Fix:** Update backend `.env` with service_role key

2. **"Failed to load configuration from database"**
   - **Cause:** Tables don't exist or no active version
   - **Fix:** Run database setup script

3. **Timer not resetting**
   - **Cause:** Missing `key` prop on Timer component
   - **Fix:** Add `key={currentQuestionIndex}` or similar

4. **Scores not displaying**
   - **Cause:** Backend response format mismatch
   - **Fix:** Check transformer utility handles response correctly

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-15  
**Project:** NeuRazor Scoring Testbed

