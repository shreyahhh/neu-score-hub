# Card Flip Challenge - Complete Documentation

## Game Overview
**Game Type:** `card_flip_challenge`  
**Component:** `src/pages/games/CardFlipEasy.tsx`  
**Route:** `/games/card-flip-easy`  
**Status:** ✅ Fully Implemented

## Game Configuration

### Pattern System
- **Source:** Pattern rotation system with localStorage
- **Storage Key:** `'cardFlipPlayedPatterns'`
- **Master Queue:** `['mirror', 'sequential', 'horizontalMirror', 'verticalMirror']`
- **Rotation:** Cycles through all 4 patterns before repeating

### Pattern Types
1. **mirror:** Position i matches position (N-1-i)
2. **sequential:** Position 2i matches position 2i+1
3. **horizontalMirror:** Same row, column c matches column (COLS-1-c)
4. **verticalMirror:** Same column, row r matches row (ROWS-1-r)

### Game Stages
1. **Stage 1**
   - Grid: 4×5 (20 cards, 10 pairs)
   - Time Limit: 60 seconds
   - Minimum Flips: 20 (perfect pattern recognition)

2. **Stage 2**
   - Grid: 5×6 (30 cards, 15 pairs)
   - Time Limit: 90 seconds
   - Minimum Flips: 30 (perfect pattern recognition)

### Timer Configuration
- **Stage 1:** 60 seconds countdown
- **Stage 2:** 90 seconds countdown
- **Single Timer:** Per stage (not per flip)

### Game Flow
1. **Instructions Screen** → Shows game rules
2. **Stage 1** → 4×5 grid, 60 seconds
3. **Stage 1 Complete** → Transition screen
4. **Stage 2** → 5×6 grid, 90 seconds
5. **Results Screen** → Shows score breakdown

## Data Submission

### API Endpoint
- **Function:** `submitGame('card_flip_challenge', raw_data, DEFAULT_USER_ID)`
- **Location:** `src/lib/api.ts` → `submitGame()`
- **Endpoint:** `POST /api/games/submit`
- **Backend Game Type:** `card_flip_challenge`

### Submission Format
```javascript
{
  game_type: "card_flip_challenge",
  user_id: "uuid",
  raw_data: {
    stage1: {
      pairs_matched: 8,
      total_pairs: 10,
      total_flips: 25,
      min_flips_possible: 20,
      time_taken: 45.3,
      time_limit: 60,
      pattern_type: "mirror",              // Current pattern for session
      pattern_matches: 7,                  // Matches following pattern
      random_matches: 1,                   // Matches not following pattern
      pattern_discovered: true,            // Pattern was discovered
      pattern_recognition_score: 85,       // Frontend-calculated
      discovery_move: 5                    // Move number when discovered
    },
    stage2: {
      pairs_matched: 12,
      total_pairs: 15,
      total_flips: 35,
      min_flips_possible: 30,
      time_taken: 70.2,
      time_limit: 90,
      pattern_type: "mirror",              // Same pattern as Stage 1
      pattern_matches: 11,
      random_matches: 1,
      pattern_discovered: true,
      pattern_recognition_score: 88,
      discovery_move: 3
    },
    totals: {
      total_pairs_matched: 20,
      total_pairs_possible: 25,
      total_flips: 60,
      total_min_flips: 50,
      total_time_taken: 115.5,
      total_time_limit: 150,
      pattern_type: "mirror",
      pattern_discovered: true,
      pattern_recognition_score: 86.5
    }
  }
}
```

### Data Collection
- **Pattern Selection:** Selected at game start, used for both stages
- **Move Tracking:** Records each flip with pattern match detection
- **Time Tracking:** Records `time_taken` for each stage
- **Pattern Discovery:** Detects when user discovers pattern (80%+ pattern matches in recent moves)

## Scoring System

### Score Retrieval
- **Primary Source:** Backend API response
- **Fallback:** Frontend-calculated scores if backend fails
- **Response Format:**
  ```javascript
  {
    session_id: "uuid",
    version_used: "V1",
    scores: {
      final_score: 85.5,
      competencies: {
        pattern_recognition: { raw: 90, weight: 0.40, weighted: 36 },
        accuracy: { raw: 80, weight: 0.25, weighted: 20 },
        speed: { raw: 85, weight: 0.20, weighted: 17 },
        strategy: { raw: 75, weight: 0.15, weighted: 11.25 }
      },
      raw_stats: { ... }
    }
  }
  ```

### Fallbacks
- **Frontend Scoring:** Calculates scores if backend fails
- **Error Handling:** If backend fails, uses frontend-calculated scores
- **No Local Storage:** No fallback scores stored locally

### Competencies Tested
1. **Pattern Recognition** (40% weight) - PRIMARY METRIC
   - **Calculation:** Analyzes if matches follow the pattern
   - **Formula:** 
     - Base: `(pattern_matches / total_correct_matches) * 100`
     - Early discovery bonus: `(1 - (discovery_move / total_moves)) * 20`
     - Random match penalty: 50% if random > 2× pattern
   - **Frontend Logic:** Uses pattern-specific checker functions

2. **Accuracy** (25% weight)
   - **Calculation:** Percentage of pairs matched
   - **Formula:** `(pairs_matched / total_pairs) * 100`
   - **Weighted:** Stage 1 (40%) + Stage 2 (60%)

3. **Speed** (20% weight)
   - **Calculation:** Time efficiency
   - **Formula:** `(1 - (time_taken / time_limit)) * 100 * 1.2`
   - **Bonus:** +10 if completed in <50% of time limit
   - **Weighted:** Stage 1 (40%) + Stage 2 (60%)

4. **Strategy/Efficiency** (15% weight)
   - **Calculation:** Flips vs minimum possible
   - **Formula:** `(min_flips_possible / actual_flips) * 100`
   - **Bonus:** +15 if perfect accuracy but efficiency <80%
   - **Weighted:** Stage 1 (40%) + Stage 2 (60%)

### Final Score Calculation
```
Final Score = (
  Pattern Recognition × 0.40 +
  Accuracy × 0.25 +
  Speed × 0.20 +
  Efficiency × 0.15
)
```

## Backend Integration

### Expected Backend Behavior
1. **Receives:** Stage 1, Stage 2, and totals data with pattern information
2. **Calculates:** All 4 competencies using configured formulae
3. **Returns:** Complete score breakdown with `session_id` and `version_used`

### Backend Configuration
- **Scoring Version:** Retrieved from backend (stored in `version_used`)
- **Active Config:** Backend uses active scoring configuration for this game type
- **Config Endpoint:** `GET /api/scoring/active/card_flip_challenge`

### Key Data Points for Backend
- **Pattern Type:** Frontend sends `pattern_type` for each stage
- **Pattern Matches:** Frontend sends `pattern_matches` and `random_matches`
- **Pattern Discovery:** Frontend sends `pattern_discovered` and `discovery_move`
- **Stage Data:** Separate metrics for Stage 1 and Stage 2
- **Totals:** Aggregated metrics across both stages

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
- **Game Component:** `src/pages/games/CardFlipEasy.tsx`
- **API Client:** `src/lib/api.ts` (submitGame function)
- **Score Display:** `src/components/ScoreDisplay.tsx`
- **Transformers:** `src/lib/transformers.ts`
- **Types:** `src/lib/types.ts`
- **Documentation:** `CARD_FLIP_SCORING_DOCUMENTATION.md`

### Backend Endpoints
- **Submit:** `POST /api/games/submit`
- **Get Config:** `GET /api/scoring/active/card_flip_challenge`
- **Get History:** `GET /api/games/results/card_flip_challenge`
- **Get Versions:** `GET /api/scoring/versions/card_flip_challenge`

## Notes for Backend Development

1. **Pattern System:** Frontend manages pattern rotation - backend receives `pattern_type`
2. **Pattern Detection:** Frontend sends pattern match data - backend can use or recalculate
3. **Two Stages:** Backend receives separate data for Stage 1 and Stage 2
4. **Pattern Consistency:** Same `pattern_type` used for both stages in a session
5. **Frontend Scoring:** Frontend calculates scores as fallback - backend should override
6. **Session Creation:** Backend creates session on submission
7. **Version Tracking:** Backend should return `version_used` for transparency
8. **Pattern Recognition:** Backend should use `pattern_type` to validate pattern matches
9. **Discovery Metrics:** Backend can use `pattern_discovered` and `discovery_move` for analysis

## Testing Considerations

- **Pattern Types:** Test all 4 pattern types
- **Pattern Discovery:** Test with/without pattern discovery
- **Two Stages:** Test completion of both stages
- **Timeout Scenarios:** Test when time expires
- **Pattern Matching:** Test pattern match detection accuracy
- **Backend Failures:** Test fallback to frontend scoring
- **Score Validation:** Verify all 4 competencies are calculated correctly
- **Pattern Rotation:** Test pattern rotation across sessions

