# AI Debate (Debate Mode) - Complete Documentation

## Game Overview
**Game Type:** `ai_debate`  
**Component:** `src/pages/games/DebateMode.tsx`  
**Route:** `/games/debate-mode`  
**Status:** ✅ Fully Implemented

## Game Configuration

### Questions/Topics
- **Source:** Backend database via API
- **API Endpoint:** `GET /api/content/ai_debate`
- **Function:** `getGameContent('ai_debate')` from `src/lib/api.ts`
- **Fallback:** Hardcoded topic if API fails

### Content Structure
```javascript
{
  content_id: "uuid",              // Database ID for tracking
  game_type: "ai_debate",
  statement: "Remote work is more productive than office work for most knowledge workers",  // Debate statement/topic
  time_limit_pros: 180,            // Optional, time limit for PROS (seconds)
  time_limit_cons: 180              // Optional, time limit for CONS (seconds)
}
```

**Note:** Backend returns `statement` field (not `topic`). Frontend checks for `statement`, `topic`, or `debate_statement` for compatibility.

### Timer Configuration
- **Time Per Argument:** Configurable from backend (default 90 seconds)
  - Backend can provide `time_limit_pros` and `time_limit_cons`
  - If provided, uses backend value; otherwise defaults to 90 seconds
- **Statement Display:** 5 seconds to read the topic
- **Total Game Time:** ~185 seconds (5s display + 90s pros + 90s cons) or as configured by backend

### Game Flow
1. **Instructions Screen** → Shows game rules
2. **Statement Display** → 5 seconds to read the debate topic
3. **PROS Writing** → 90 seconds to write pros argument
4. **CONS Writing** → 90 seconds to write cons argument
5. **Results Screen** → Shows AI-evaluated scores

## Data Submission

### API Endpoint
- **Function:** `submitAIGame('ai_debate', responseData, userId, contentId)`
- **Location:** `src/lib/api.ts` → `submitAIGame()`
- **Endpoint:** `POST /api/ai/submit-game`
- **Backend Game Type:** `ai_debate`

### Submission Format
```javascript
{
  game_type: "ai_debate",
  user_id: "uuid",
  content_id: "uuid",              // Optional: which topic was used
  response_data: {
    topic: "Is remote work better than office work?",  // Debate topic/statement
    pros_text: "User's argument for the PROS side...",  // Pros arguments text
    cons_text: "User's argument for the CONS side...",  // Cons arguments text
    num_points_pros: 5,             // Number of pros points/arguments
    num_points_cons: 4,             // Number of cons points/arguments
    time_taken: 180.5               // Total time for both arguments (seconds)
  }
}
```

### Data Collection
- **Topic:** Fetched from backend or fallback
- **Pros Argument:** User's text input for PROS side
- **Cons Argument:** User's text input for CONS side
- **Point Counting:** Counts lines/bullet points with content (>10 chars)
- **Time Tracking:** Records time for PROS and CONS separately, sums for total
- **Content ID:** Tracks which debate topic was used

## Scoring System

### Score Retrieval
- **Primary Source:** Backend AI API response
- **Response Format:**
  ```javascript
  {
    session_id: "uuid",
    version_used: "V1",
    ai_scores: {
      reasoning: 85,
      communication: 80,
      cognitive_agility: 90,
      holistic_analysis: 75
    },
    final_scores: {
      final_score: 82.5,
      competencies: {
        reasoning: { raw: 85, weight: 0.40, weighted: 34 },
        communication: { raw: 80, weight: 0.10, weighted: 8 },
        cognitive_agility: { raw: 90, weight: 0.20, weighted: 18 },
        holistic_analysis: { raw: 75, weight: 0.30, weighted: 22.5 }
      }
    }
  }
  ```

### Fallbacks
- **No Frontend Scoring:** This game relies entirely on backend AI scoring
- **Error Handling:** If backend fails, shows alert with error message
- **No Local Storage:** No fallback scores stored locally
- **Topic Fallback:** Uses hardcoded topic if content API fails

### Competencies Tested (AI-Evaluated)
1. **Reasoning** (40% weight)
   - **Evaluation:** AI analyzes logical argument structure, evidence use, and coherence for both PROS and CONS
   - **Backend Logic:** Uses AI (Google Gemini) to evaluate:
     - Strength of logical reasoning
     - Use of evidence and examples
     - Coherence of arguments
     - Quality of supporting points

2. **Communication** (10% weight)
   - **Evaluation:** AI analyzes persuasiveness, grammar, and vocabulary
   - **Backend Logic:** AI evaluates:
     - Persuasive presentation of ideas
     - Proper grammar and sentence structure
     - Rich and appropriate vocabulary
     - Professional tone

3. **Cognitive Agility** (20% weight)
   - **Evaluation:** AI analyzes perspective switching and mental flexibility
   - **Backend Logic:** AI evaluates:
     - Ability to argue both sides convincingly
     - Genuine understanding of opposing viewpoints
     - Flexibility in shifting between perspectives
     - Lack of bias toward one position

4. **Holistic Analysis** (30% weight)
   - **Evaluation:** AI analyzes balance and comprehensiveness across BOTH sides
   - **Backend Logic:** AI evaluates:
     - Equal depth given to pros and cons
     - Coverage of multiple dimensions of the topic
     - Recognition of complexity and nuance
     - Avoidance of one-sided analysis

### Final Score Calculation
```
Final Score = (
  Reasoning × 0.40 +
  Communication × 0.10 +
  Cognitive Agility × 0.20 +
  Holistic Analysis × 0.30
)
```

## Backend Integration

### Expected Backend Behavior
1. **Receives:** Topic, pros_text, cons_text, num_points_pros, num_points_cons, time_taken
2. **Extracts Variables:** Backend extracts scoring variables:
   - `pros_text`: Pros arguments text
   - `cons_text`: Cons arguments text
   - `num_points_pros`: Number of pros points
   - `num_points_cons`: Number of cons points
   - `balance_score`: Calculated from pros/cons balance
   - `depth`: Evaluated by AI
   - `evidence_used`: Evaluated by AI
   - `language_quality`: Evaluated by AI
   - `logical_consistency`: Evaluated by AI
   - `time_taken`: From frontend
   - `perspective_switching_ability`: Evaluated by AI
3. **AI Evaluation:** Uses AI (Google Gemini) to evaluate competencies
4. **Calculates:** Competency scores using configured formulae
5. **Returns:** Complete score breakdown with `session_id` and `version_used`

### Backend Configuration
- **Scoring Version:** Retrieved from backend (stored in `version_used`)
- **Active Config:** Backend uses active scoring configuration for this game type
- **Config Endpoint:** `GET /api/scoring/active/ai_debate`
- **AI Provider:** Backend uses Google Gemini API (or mock if no API key)

### Content Management
- **Content Endpoint:** `GET /api/content/ai_debate`
- **Content Storage:** Backend stores topics in `game_content` table
- **Content ID Tracking:** Frontend sends `content_id` to track which topic was used

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
- **Game Component:** `src/pages/games/DebateMode.tsx`
- **API Client:** `src/lib/api.ts` (submitAIGame, getGameContent functions)
- **Score Display:** `src/components/ScoreDisplay.tsx`
- **Transformers:** `src/lib/transformers.ts`
- **Types:** `src/lib/types.ts`

### Backend Endpoints
- **Submit:** `POST /api/ai/submit-game`
- **Get Content:** `GET /api/content/ai_debate`
- **Get Config:** `GET /api/scoring/active/ai_debate`
- **Get History:** `GET /api/games/results/ai_debate`
- **Get Versions:** `GET /api/scoring/versions/ai_debate`

## Notes for Backend Development

1. **Content Source:** Topics come from database via `/api/content/ai_debate`
2. **AI Evaluation:** Backend must use AI (Google Gemini) to evaluate both pros and cons
3. **Content ID:** Frontend sends `content_id` - backend should track this
4. **Response Format:** Frontend sends `topic`, `pros_text`, `cons_text`, `num_points_pros`, `num_points_cons`, `time_taken`
5. **Point Counting:** Frontend counts points, but backend can recalculate if needed
6. **Time Tracking:** Frontend sends total `time_taken` (pros + cons)
7. **Scoring Dependency:** Frontend has no fallback scoring - must rely on backend AI
8. **Session Creation:** Backend creates session on submission
9. **Version Tracking:** Backend should return `version_used` for transparency
10. **AI Fallback:** Backend should have mock AI scoring if API key unavailable
11. **Backend Variables:** Backend expects these variables for scoring:
    - `pros_text` - Pros arguments text
    - `cons_text` - Cons arguments text
    - `num_points_pros` - Number of pros points
    - `num_points_cons` - Number of cons points
    - `balance_score` - Calculated from pros/cons balance
    - `depth` - Evaluated by AI
    - `evidence_used` - Evaluated by AI
    - `language_quality` - Evaluated by AI
    - `logical_consistency` - Evaluated by AI
    - `time_taken` - Total time from frontend
    - `perspective_switching_ability` - Evaluated by AI
12. **Format Match:** Frontend now sends format matching backend: `{ topic, pros_text, cons_text, num_points_pros, num_points_cons, time_taken }`

## Testing Considerations

- **Content Loading:** Test with/without backend content API
- **AI Evaluation:** Test AI scoring with various argument qualities
- **Timeout Scenarios:** Test when timer expires for pros or cons
- **Empty Arguments:** Test handling of empty pros or cons text
- **Point Counting:** Test with various argument formats (bullets, paragraphs, etc.)
- **Backend Failures:** Test error handling when API fails
- **Score Validation:** Verify all 4 competencies are evaluated correctly
- **Content Tracking:** Verify `content_id` is properly tracked
- **Time Variations:** Test with different completion times
- **Balance Testing:** Test with balanced vs unbalanced pros/cons arguments

