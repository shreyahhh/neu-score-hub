# Pattern Sudoku (Sign Sudoku) - Complete Documentation

## Game Overview
**Game Type:** `sign_sudoku`  
**Component:** `src/pages/games/PatternSudoku.tsx`  
**Route:** `/games/pattern-sudoku`  
**Status:** ✅ Fully Implemented

## Game Configuration

### Puzzles/Questions
- **Source:** Hardcoded in data file
- **Location:** `src/data/sudokuQuestions.ts`
- **Import:** `EASY_SUDOKU`, `MEDIUM_SUDOKU`, `HARD_SUDOKU`
- **Format:** Each puzzle has:
  - `grid`: 2D array with patterns (empty strings for empty cells)
  - `solution`: 2D array with complete solution
  - `emptyCells`: Number of cells to fill

### Difficulty Levels
1. **Easy**
   - Grid: 4×4
   - Timer: 60 seconds
   - Patterns: ●, ■, ▲, ★
   - Empty Cells: 9

2. **Medium**
   - Grid: 5×5
   - Timer: 90 seconds
   - Patterns: ●, ■, ▲, ★, ◆
   - Empty Cells: 14

3. **Hard**
   - Grid: 5×5
   - Timer: 120 seconds
   - Patterns: ●, ■, ▲, ★, ◆
   - Empty Cells: 20

### Timer Configuration
- **Single Timer:** For entire game (not per cell)
- **Countdown:** From difficulty-specific time limit
- **Time Tracking:** Records `time_left_sec` and `total_time_allowed`

### Game Flow
1. **Welcome Screen** → Choose difficulty (Easy/Medium/Hard)
2. **Playing State** → Fill grid with patterns, single timer for entire game
3. **Results Screen** → Shows score breakdown

## Data Submission

### API Endpoint
- **Function:** `submitGame('sign_sudoku', rawData, DEFAULT_USER_ID)`
- **Location:** `src/lib/api.ts` → `submitGame()`
- **Endpoint:** `POST /api/games/submit`
- **Backend Game Type:** `sign_sudoku`

### Submission Format
```javascript
{
  game_type: "sign_sudoku",
  user_id: "uuid",
  raw_data: {
    correct_entries: 12,              // User-filled correct cells
    incorrect_entries: 2,             // User-filled incorrect cells
    total_empty_cells: 16,            // Cells user needs to fill
    time_left_sec: 45,                // Time remaining when finished
    total_time_allowed: 60,           // Initial time limit
    total_attempts: 14,               // correct_entries + incorrect_entries
    avg_time_per_correct_entry: 8.5,  // Calculated: total_time_spent / correct_entries
    completion_percent: 75.0,          // (correct_entries / total_empty_cells) * 100
    accuracy_percent: 85.7,            // (correct_entries / total_attempts) * 100
    grid_size: 4,                      // 4 for easy, 5 for medium/hard
    correct_first_attempts: 10,        // Entries correct on first try
    difficulty_multiplier: 1.0,        // 1.0 (easy), 1.2 (medium), 1.5 (hard)
    
    // Legacy fields for backward compatibility
    difficulty: "easy",                // "easy" | "medium" | "hard"
    is_completed: false,                // All cells filled and correct
    errors_made: 2,                    // Same as incorrect_entries
    total_time: 15.0,                  // Time spent (total_time_allowed - time_left_sec)
    hints_used: 0                      // Currently not implemented
  }
}
```

### Data Collection
- **Correct Entries:** Counts user-filled cells matching solution
- **Incorrect Entries:** Counts user-filled cells not matching solution
- **Time Tracking:** Records from `stats.startTime` to completion
- **First Attempts:** Tracks entries that were correct on first try
- **Completion Status:** Checks if all cells filled and correct

## Scoring System

### Score Retrieval
- **Primary Source:** Backend API response
- **Response Format:**
  ```javascript
  {
    session_id: "uuid",
    version_used: "V1",
    scores: {
      final_score: 78.5,
      competencies: {
        accuracy: { raw: 85, weight: 0.XX, weighted: XX },
        reasoning: { raw: 80, weight: 0.XX, weighted: XX },
        attention_to_detail: { raw: 75, weight: 0.XX, weighted: XX },
        speed: { raw: 70, weight: 0.XX, weighted: XX },
        math: { raw: 82, weight: 0.XX, weighted: XX }
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
1. **Accuracy** (weight varies by config)
   - **Calculation:** Backend calculates based on correct vs incorrect entries
   - **Formula:** `((correct_entries / total_empty) * 100) - (incorrect_entries * penalty)`
   - **Backend Logic:** Rewards correct entries, penalizes errors

2. **Reasoning** (weight varies by config)
   - **Calculation:** Backend analyzes pattern recognition and logical deduction
   - **Formula:** `((correct_entries / total_attempts) * 100) * difficulty_multiplier`
   - **Backend Logic:** Measures logical reasoning ability

3. **Attention to Detail** (weight varies by config)
   - **Calculation:** Backend analyzes precision and first-attempt accuracy
   - **Formula:** `(accuracy * 0.6) + (correct_first_attempts / total_empty * 40)`
   - **Backend Logic:** Rewards careful, precise work

4. **Speed** (weight varies by config)
   - **Calculation:** Backend analyzes time efficiency
   - **Formula:** `(time_left / total_time * 50) + (50 / (avg_time_per_correct + 1))`
   - **Backend Logic:** Rewards fast completion with time remaining

5. **Math** (weight varies by config)
   - **Calculation:** Backend may analyze mathematical patterns
   - **Formula:** Varies by backend configuration
   - **Backend Logic:** Measures mathematical reasoning

### Final Score Calculation
```
Final Score = (
  Accuracy × weight +
  Reasoning × weight +
  Attention to Detail × weight +
  Speed × weight +
  Math × weight
)
```
*Weights are configured in backend scoring configuration*

## Backend Integration

### Expected Backend Behavior
1. **Receives:** Game completion data with metrics
2. **Calculates:** All competencies using configured formulae
3. **Returns:** Complete score breakdown with `session_id` and `version_used`

### Backend Configuration
- **Scoring Version:** Retrieved from backend (stored in `version_used`)
- **Active Config:** Backend uses active scoring configuration for this game type
- **Config Endpoint:** `GET /api/scoring/active/sign_sudoku`
- **Difficulty Multiplier:** Backend should use `difficulty_multiplier` for scaling

### Key Data Points for Backend
- **Completion Status:** `is_completed` indicates perfect completion
- **Time Efficiency:** `time_left_sec` and `avg_time_per_correct_entry` for speed
- **Accuracy Metrics:** `completion_percent` and `accuracy_percent`
- **First Attempts:** `correct_first_attempts` for attention to detail
- **Difficulty:** `difficulty_multiplier` for scaling scores

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
- **Game Component:** `src/pages/games/PatternSudoku.tsx`
- **Puzzle Data:** `src/data/sudokuQuestions.ts`
- **API Client:** `src/lib/api.ts` (submitGame function)
- **Score Display:** `src/components/ScoreDisplay.tsx`
- **Transformers:** `src/lib/transformers.ts`
- **Types:** `src/lib/types.ts`

### Backend Endpoints
- **Submit:** `POST /api/games/submit`
- **Get Config:** `GET /api/scoring/active/sign_sudoku`
- **Get History:** `GET /api/games/results/sign_sudoku`
- **Get Versions:** `GET /api/scoring/versions/sign_sudoku`

## Notes for Backend Development

1. **Puzzle Source:** Puzzles are hardcoded in frontend data file
2. **Difficulty Handling:** Frontend sends `difficulty_multiplier` - backend should use this
3. **Time Metrics:** Frontend sends multiple time metrics - backend can use any/all
4. **Completion Status:** Frontend calculates `is_completed` - backend can verify
5. **First Attempts:** Frontend tracks `correct_first_attempts` - backend should use for attention to detail
6. **Scoring Dependency:** Frontend has no fallback scoring - must rely on backend
7. **Session Creation:** Backend creates session on submission
8. **Version Tracking:** Backend should return `version_used` for transparency
9. **Grid Size:** Frontend sends `grid_size` - backend can use for normalization

## Testing Considerations

- **Difficulty Levels:** Test all three difficulty levels
- **Completion Scenarios:** Test partial and complete solutions
- **Time Variations:** Test with different time remaining
- **Error Rates:** Test with various incorrect entry counts
- **First Attempts:** Test scoring with different first-attempt accuracy
- **Backend Failures:** Test error handling when API fails
- **Score Validation:** Verify all competencies are calculated correctly

