# Stroop Test - Complete Documentation

## Game Overview
**Game Type:** `stroop_test`  
**Component:** `src/pages/games/StroopTestStandard.tsx`  
**Route:** `/games/stroop-test-standard`  
**Status:** ✅ Fully Implemented

## Game Configuration

### Questions/Stimuli
- **Source:** Generated programmatically with fixed seed
- **Location:** `src/pages/games/StroopTestStandard.tsx` (lines 66-114)
- **Generation Function:** `generateQuestionsWithSeed()`
- **Seed Value:** Fixed seed (12345) for consistency
- **Count:** 10 questions
- **Task Types:** Alternates between `read_word` and `name_color`

### Question Generation Logic
```javascript
// Words available: RED, BLUE, GREEN, TEAL, ORANGE, PURPLE, PINK, GRAY
// Colors available: red, blue, green, teal, orange, purple, pink, gray
// Each question:
//   - Random word (e.g., "RED")
//   - Random font color (different from word, e.g., blue)
//   - Task: read_word OR name_color (alternates)
//   - Correct answer: word if read_word, color if name_color
//   - Interference: true if word ≠ color
```

### Color Configuration
- **Color Map:** `COLOR_MAP` object (lines 12-21)
- **Available Colors:** red, blue, green, teal, orange, purple, pink, gray
- **Hex Values:** Mapped to Tailwind color palette

### Timer Configuration
- **Time Per Question:** 5 seconds
- **Timer Resets:** Yes, for each question (using `key={currentQuestionIndex}`)
- **Total Game Time:** ~50 seconds (10 questions × 5 seconds)

### Game Flow
1. **Instructions Screen** → Explains word/color task
2. **Start Button** → User clicks to begin
3. **Playing State** → 10 questions, 5 seconds each
4. **Results Screen** → Shows score breakdown

## Data Submission

### API Endpoint
- **Function:** `submitGame('stroop_test', raw_data)`
- **Location:** `src/lib/api.ts` → `submitGame()`
- **Endpoint:** `POST /api/games/submit`
- **Backend Game Type:** `stroop_test`

### Submission Format
```javascript
{
  game_type: "stroop_test",
  user_id: "uuid",
  raw_data: [
    {
      word: "RED",                    // Word displayed
      color: "#DC2626",               // Hex color of font
      user_response: "red",            // User's answer (text)
      is_correct: true,               // Boolean
      is_interference: true,           // Word ≠ color (interference present)
      time_taken: 1.8,                // Seconds (0 to 5)
      
      // Additional metadata
      question_id: 1,
      task: "read_word",              // or "name_color"
      option_1_text: "red",
      option_1_color: "#DC2626",
      option_2_text: "blue",
      option_2_color: "#DC2626",
      correct_answer: "red",
      interference_level: "high",     // or "low"
      max_allowed_time_ms: 5000,
      answered_at: "2025-01-15T10:00:00Z"
    },
    // ... 9 more questions
  ]
}
```

### Data Collection
- **Time Tracking:** Records `response_time_ms` from `questionStartTime`
- **Answer Validation:** Compares `answerText.toLowerCase() === question.correctAnswer.toLowerCase()`
- **Interference Detection:** `hasInterference = wordLower !== fontColorLower`
- **Timeout Handling:** If timer expires, records `user_answer: null`, `is_correct: false`, `time_taken: 5`

## Scoring System

### Score Retrieval
- **Primary Source:** Backend API response
- **Response Format:**
  ```javascript
  {
    session_id: "uuid",
    version_used: "V1",
    scores: {
      final_score: 82.5,
      competencies: {
        cognitive_flexibility: { raw: 85, weight: 0.30, weighted: 25.5 },
        cognitive_agility: { raw: 90, weight: 0.30, weighted: 27 },
        accuracy: { raw: 80, weight: 0.20, weighted: 16 },
        speed: { raw: 75, weight: 0.20, weighted: 15 }
      },
      raw_stats: { ... }
    }
  }
  ```

### Fallbacks
- **No Frontend Scoring:** This game relies entirely on backend scoring
- **Error Handling:** If backend fails, shows alert: "Failed to submit game. Please try again."
- **No Local Storage:** No fallback scores stored locally

### Competencies Tested
1. **Cognitive Flexibility** (30% weight)
   - **Calculation:** Backend analyzes performance on interference items
   - **Formula:** Penalty for errors on interference items
   - **Backend Logic:** Measures ability to suppress automatic reading response

2. **Cognitive Agility** (30% weight)
   - **Calculation:** Backend combines accuracy and speed
   - **Formula:** `(accuracy * 0.6) + (speed * 0.4)`
   - **Backend Logic:** Measures quick cognitive switching

3. **Accuracy** (20% weight)
   - **Calculation:** Backend calculates correct responses
   - **Formula:** `(correct / total) * 100`
   - **Backend Logic:** Basic correctness measure

4. **Speed** (20% weight)
   - **Calculation:** Backend analyzes response times
   - **Formula:** `100 - ((avg_time / max_time) * 40)`
   - **Backend Logic:** Rewards faster responses

### Final Score Calculation
```
Final Score = (
  Cognitive Flexibility × 0.30 +
  Cognitive Agility × 0.30 +
  Accuracy × 0.20 +
  Speed × 0.20
)
```

## Backend Integration

### Expected Backend Behavior
1. **Receives:** Array of question responses with timing and interference data
2. **Calculates:** All 4 competencies using configured formulae
3. **Returns:** Complete score breakdown with `session_id` and `version_used`

### Backend Configuration
- **Scoring Version:** Retrieved from backend (stored in `version_used`)
- **Active Config:** Backend uses active scoring configuration for this game type
- **Config Endpoint:** `GET /api/scoring/active/stroop_test`

### Key Data Points for Backend
- **Interference Items:** Questions where `is_interference: true`
- **Task Type:** `read_word` vs `name_color` (affects difficulty)
- **Response Time:** Critical for speed and agility calculations
- **Correctness:** Binary for accuracy calculation

## Frontend Display

### Score Display Component
- **Component:** `src/components/ScoreDisplay.tsx`
- **Transformation:** Uses `transformGameResult()` from `src/lib/transformers.ts`
- **Display Format:**
  - Final score (large number)
  - Competency breakdown (bars and percentages)
  - Weighted contributions table
  - Scoring version indicator

## Key Files Reference

### Frontend Files
- **Game Component:** `src/pages/games/StroopTestStandard.tsx`
- **API Client:** `src/lib/api.ts` (submitGame function)
- **Score Display:** `src/components/ScoreDisplay.tsx`
- **Transformers:** `src/lib/transformers.ts`
- **Types:** `src/lib/types.ts`

### Backend Endpoints
- **Submit:** `POST /api/games/submit`
- **Get Config:** `GET /api/scoring/active/stroop_test`
- **Get History:** `GET /api/games/results/stroop_test`
- **Get Versions:** `GET /api/scoring/versions/stroop_test`

## Notes for Backend Development

1. **Question Generation:** Questions are generated client-side with fixed seed
2. **Interference Detection:** Frontend sends `is_interference` flag - backend should use this
3. **Task Type:** Frontend sends `task` field - backend can use for analysis
4. **Color Format:** Frontend sends hex colors - backend may need to normalize
5. **Response Time:** Frontend sends `time_taken` in seconds, but also `response_time_ms` in milliseconds
6. **Scoring Dependency:** Frontend has no fallback scoring - must rely on backend
7. **Session Creation:** Backend creates session on submission
8. **Version Tracking:** Backend should return `version_used` for transparency

## Testing Considerations

- **Interference Items:** Test scoring with/without interference
- **Task Types:** Test both `read_word` and `name_color` tasks
- **Timeout Scenarios:** Test when user doesn't answer in time
- **Speed Variations:** Test with different response times
- **Backend Failures:** Test error handling when API fails
- **Score Validation:** Verify all 4 competencies are calculated correctly

