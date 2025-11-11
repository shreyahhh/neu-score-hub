# Scenario Challenge - Backend Database Flow

## Overview

The Scenario Challenge is an **AI-scored game** that interacts with three main database tables when a user submits their responses.

---

## Database Tables

### 1. `scoring_versions` Table

**Purpose**: Stores the AI prompts and scoring configuration for the game.

**Query Flow**:
```sql
SELECT * FROM scoring_versions 
WHERE game_type = 'scenario_challenge' 
AND is_active = true;
```

**Key Columns**:
- `game_type`: `'scenario_challenge'`
- `is_active`: `true` for the active version
- `config` (JSONB): Contains:
  - **AI Prompts**: System and user prompts sent to Gemini API
  - **Scoring Rubric**: Criteria for evaluating competencies
  - **Final Weights**: Weights for calculating final score from AI scores

**Example Config Structure**:
```json
{
  "ai_prompts": {
    "reasoning": "Evaluate the user's logical reasoning...",
    "empathy": "Assess the user's emotional intelligence...",
    "problem_solving": "Analyze problem-solving approach...",
    "communication": "Evaluate communication clarity..."
  },
  "final_weights": {
    "reasoning": 0.3,
    "empathy": 0.25,
    "problem_solving": 0.25,
    "communication": 0.2
  }
}
```

---

### 2. `test_sessions` Table

**Purpose**: Main table for recording game results and storing final calculated scores.

**Operations**:
1. **INSERT**: Creates a new session record when first response is submitted
2. **UPDATE**: Updates the session with final scores when all responses are processed

**Key Columns**:
- `id`: Unique session ID (UUID)
- `user_id`: ID of the user who played
- `game_type`: `'scenario_challenge'`
- `scoring_version_id`: Foreign key to `scoring_versions.id` (which version was used)
- `status`: `'in_progress'` → `'completed'`
- `final_scores` (JSONB): Final calculated scores
- `created_at`: When session was created
- `completed_at`: When session was marked complete

**final_scores JSONB Structure**:
```json
{
  "final_score": 85.23,
  "competencies": {
    "reasoning": {
      "raw": 82.0,
      "weighted": 24.6,
      "weight": 0.3
    },
    "empathy": {
      "raw": 88.0,
      "weighted": 22.0,
      "weight": 0.25
    }
  },
  "ai_scores": {
    "reasoning": 82,
    "empathy": 88,
    "problem_solving": 85,
    "communication": 80,
    "feedback": "Strong empathy shown..."
  },
  "raw_stats": {
    "total_questions": 4,
    "total_time": 180.5
  }
}
```

---

### 3. `text_receipts` Table

**Purpose**: Acts as a log, storing the user's exact text responses for review or reprocessing.

**Operation**: `INSERT` only (one record per question response)

**Key Columns**:
- `id`: Unique receipt ID (UUID)
- `session_id`: Foreign key to `test_sessions.id`
- `response_data` (JSONB/TEXT): User's written response

**response_data Structure**:
```json
{
  "scenario_text": "You overhear a disagreement between two colleagues...",
  "question_text": "What are the potential underlying reasons?",
  "response_text": "User's detailed response here...",
  "response_length": 250,
  "time_taken": 45.2,
  "question_id": 1
}
```

---

## Backend Flow (When User Submits)

### Step 1: Retrieve Scoring Configuration
```sql
-- Backend queries scoring_versions
SELECT config FROM scoring_versions 
WHERE game_type = 'scenario_challenge' AND is_active = true;
```

### Step 2: Create or Update Session
```sql
-- If first submission, INSERT new session
INSERT INTO test_sessions (user_id, game_type, scoring_version_id, status)
VALUES (user_id, 'scenario_challenge', version_id, 'in_progress')
RETURNING id;

-- If session exists, UPDATE status when complete
UPDATE test_sessions 
SET status = 'completed', completed_at = NOW(), final_scores = {...}
WHERE id = session_id;
```

### Step 3: Store Text Receipt
```sql
-- INSERT text receipt for each response
INSERT INTO text_receipts (session_id, response_data)
VALUES (session_id, '{"scenario_text": "...", "response_text": "..."}');
```

### Step 4: AI Evaluation
- Backend sends each response to Gemini API using prompts from `scoring_versions.config`
- AI returns scores for each competency (reasoning, empathy, etc.)

### Step 5: Calculate Final Scores
- Apply weights from `scoring_versions.config.final_weights`
- Calculate weighted final score
- Update `test_sessions.final_scores` with all results

---

## Frontend Implementation

### Current Approach

The frontend now:
1. **Collects all responses** during gameplay
2. **Stores them in state** (`allResponses` array)
3. **Submits all at once** when the last question is answered

### Data Structure Sent to Backend

```javascript
{
  game_type: "scenario_challenge",
  user_id: "uuid",
  response_data: {
    scenario_text: "...",
    question_text: "...",
    response_text: "...",
    response_length: 250,
    time_taken: 45.2,
    question_id: 1,
    all_responses: [  // All responses for batch processing
      {
        scenario_text: "...",
        question_text: "Question 1",
        response_text: "...",
        time_taken: 45.2,
        question_id: 1
      },
      {
        scenario_text: "...",
        question_text: "Question 2",
        response_text: "...",
        time_taken: 60.0,
        question_id: 2
      }
      // ... more responses
    ],
    total_questions: 4
  }
}
```

### Backend Processing

The backend will:
1. **Query `scoring_versions`** for active configuration
2. **Create one `test_sessions` record** (or use existing if session management is handled)
3. **Create multiple `text_receipts`** (one per response in `all_responses`)
4. **Evaluate all responses** with AI using prompts from config
5. **Calculate final scores** using weights from config
6. **Update `test_sessions`** with final scores and mark as `completed`

---

## API Endpoint

**Endpoint**: `POST /api/ai/submit-game`

**Request Body**:
```json
{
  "game_type": "scenario_challenge",
  "user_id": "uuid",
  "response_data": {
    "scenario_text": "...",
    "question_text": "...",
    "response_text": "...",
    "response_length": 250,
    "time_taken": 45.2,
    "question_id": 1,
    "all_responses": [...],
    "total_questions": 4
  }
}
```

**Response**:
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
      "problem_solving": 85,
      "communication": 80,
      "feedback": "Strong empathy shown..."
    },
    "final_scores": {
      "final_score": 85.23,
      "competencies": {...}
    }
  }
}
```

---

## Notes

1. **Session Management**: The backend may handle session creation automatically. If submitting each question individually, the backend should group them into one session.

2. **Batch Submission**: The current implementation collects all responses and submits them together. If the backend doesn't support batch submission, it may need to process each response individually but still group them into one session.

3. **AI Evaluation**: All responses are evaluated using the same AI prompts from the active `scoring_versions` configuration.

4. **Final Score**: The final score is calculated by:
   - Getting AI scores for each competency
   - Applying weights from `scoring_versions.config.final_weights`
   - Summing weighted scores: `final_score = Σ(ai_score × weight)`

---

## Frontend Code Location

- **Component**: `src/pages/games/ScenarioChallenge.tsx`
- **API Function**: `src/lib/api.ts` → `submitAIGame()`
- **Game Type**: `'scenario_challenge'`

---

**Last Updated**: 2025-01-15


