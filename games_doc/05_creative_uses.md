# Creative Uses - Complete Documentation

## Game Overview
**Game Type:** `creative_uses`  
**Component:** `src/pages/games/CreativeUses.tsx`  
**Route:** `/games/creative-uses`  
**Status:** ✅ Fully Implemented

## Game Configuration

### Questions/Objects
- **Source:** Backend database via API
- **API Endpoint:** `GET /api/content/creative_uses`
- **Function:** `getGameContent('creative_uses')` from `src/lib/api.ts`
- **Fallback:** Random selection from hardcoded list if API fails

### Content Structure
```javascript
{
  content_id: "uuid",              // Database ID for tracking
  game_type: "creative_uses",
  object: "Brick",                 // or object_name
  time_limit: 60                   // Optional, defaults to 60 seconds
}
```

### Fallback Objects
- **Location:** `src/pages/games/CreativeUses.tsx` (lines 21-25)
- **List:** `['A Paperclip', 'A Bottle', 'A Pencil']`
- **Selection:** Random selection if backend fails
- **Content ID:** Generated as `'fallback-creative-' + object.toLowerCase().replace(/\s+/g, '-')`

### Timer Configuration
- **Default Duration:** 60 seconds
- **Configurable:** Can be set by backend via `time_limit` in content
- **Single Timer:** For entire game (not per use)
- **Time Tracking:** Records `time_taken` from `gameStartTime` to finish

### Game Flow
1. **Loading State** → Fetches object from backend
2. **Instructions Screen** → Shows object name
3. **Start Button** → User clicks to begin
4. **Playing State** → 60 seconds to list creative uses
5. **Results Screen** → Shows AI-evaluated scores

## Data Submission

### API Endpoint
- **Function:** `submitAIGame('creative_uses', responseData, userId, contentId)`
- **Location:** `src/lib/api.ts` → `submitAIGame()`
- **Endpoint:** `POST /api/ai/submit-game`
- **Backend Game Type:** `creative_uses`

### Submission Format
```javascript
{
  game_type: "creative_uses",
  user_id: "uuid",
  content_id: "uuid",              // Optional: which object was used
  response_data: {
    object_name: "Brick",
    uses: [
      "Use as bookmark",
      "Unlock small locks",
      "Reset electronics"
    ],
    time_taken: 55.3,              // Seconds (actual time from start)
    time_limit: 60                  // Time limit for the game
  }
}
```

### Data Collection
- **Uses List:** User adds uses one by one (stored in array)
- **Time Tracking:** Records `time_taken` from `gameStartTime` to finish/timeout
- **Content ID:** Tracks which object was used
- **Timeout Handling:** If timer expires, submits current uses with `time_taken: gameDuration`

## Scoring System

### Score Retrieval
- **Primary Source:** Backend AI API response
- **Response Format:**
  ```javascript
  {
    session_id: "uuid",
    version_used: "V1",
    ai_scores: {
      creativity: 85,
      speed: 75
    },
    final_scores: {
      final_score: 82.0,
      competencies: {
        creativity: { raw: 85, weight: 0.70, weighted: 59.5 },
        speed: { raw: 75, weight: 0.30, weighted: 22.5 }
      }
    }
  }
  ```

### Fallbacks
- **No Frontend Scoring:** This game relies entirely on backend AI scoring
- **Error Handling:** If backend fails, shows alert with error message
- **No Local Storage:** No fallback scores stored locally
- **Object Fallback:** Uses random fallback object if content API fails

### Competencies Tested (AI-Evaluated)
1. **Creativity** (70% weight)
   - **Evaluation:** AI analyzes originality, diversity, and novelty of uses
   - **Backend Logic:** Uses AI (Google Gemini) to evaluate:
     - Originality of ideas
     - Diversity of use categories
     - Novelty and creativity
     - Quality of ideas

2. **Speed** (30% weight)
   - **Calculation:** Based on number of uses per time
   - **Formula:** `(number_of_uses / time_taken) * scaling_factor`
   - **Backend Logic:** Rewards generating many uses quickly

### Final Score Calculation
```
Final Score = (
  Creativity × 0.70 +
  Speed × 0.30
)
```

## Backend Integration

### Expected Backend Behavior
1. **Receives:** Object name, list of uses, and timing data
2. **AI Evaluation:** Uses AI (Google Gemini) to evaluate creativity of uses
3. **Calculates:** Speed score based on uses per time
4. **Returns:** Complete score breakdown with `session_id` and `version_used`

### Backend Configuration
- **Scoring Version:** Retrieved from backend (stored in `version_used`)
- **Active Config:** Backend uses active scoring configuration for this game type
- **Config Endpoint:** `GET /api/scoring/active/creative_uses`
- **AI Provider:** Backend uses Google Gemini API (or mock if no API key)

### Content Management
- **Content Endpoint:** `GET /api/content/creative_uses`
- **Content Storage:** Backend stores objects in `game_content` table
- **Content ID Tracking:** Frontend sends `content_id` to track which object was used

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
- **Game Component:** `src/pages/games/CreativeUses.tsx`
- **API Client:** `src/lib/api.ts` (submitAIGame, getGameContent functions)
- **Score Display:** `src/components/ScoreDisplay.tsx`
- **Transformers:** `src/lib/transformers.ts`
- **Types:** `src/lib/types.ts`
- **Fallback Data:** `src/data/creativeUsesQuestions.ts` (not used, legacy)

### Backend Endpoints
- **Submit:** `POST /api/ai/submit-game`
- **Get Content:** `GET /api/content/creative_uses`
- **Get Config:** `GET /api/scoring/active/creative_uses`
- **Get History:** `GET /api/games/results/creative_uses`
- **Get Versions:** `GET /api/scoring/versions/creative_uses`

## Notes for Backend Development

1. **Content Source:** Objects come from database via `/api/content/creative_uses`
2. **AI Evaluation:** Backend must use AI (Google Gemini) to evaluate creativity
3. **Content ID:** Frontend sends `content_id` - backend should track this
4. **Uses Array:** Frontend sends array of use strings - backend evaluates all
5. **Time Tracking:** Frontend sends `time_taken` (actual) and `time_limit`
6. **Scoring Dependency:** Frontend has no fallback scoring - must rely on backend AI
7. **Session Creation:** Backend creates session on submission
8. **Version Tracking:** Backend should return `version_used` for transparency
9. **AI Fallback:** Backend should have mock AI scoring if API key unavailable
10. **Speed Calculation:** Backend should calculate speed based on uses per time

## Testing Considerations

- **Content Loading:** Test with/without backend content API
- **AI Evaluation:** Test AI scoring with various use qualities
- **Timeout Scenarios:** Test when timer expires
- **Empty Uses:** Test handling of no uses submitted
- **Many Uses:** Test with large number of uses
- **Backend Failures:** Test error handling when API fails
- **Score Validation:** Verify both competencies are evaluated correctly
- **Content Tracking:** Verify `content_id` is properly tracked
- **Time Variations:** Test with different completion times

