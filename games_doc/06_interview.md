# Interview Challenge - Complete Documentation

## Game Overview
**Game Type:** `interview`  
**Component:** `src/pages/games/Interview.tsx`  
**Route:** `/games/interview`  
**Status:** ✅ Fully Implemented  
**Note:** Uses `scenario_challenge` backend game type for submission

## Game Configuration

### Questions
- **Source:** Backend database via API
- **API Endpoint:** `GET /api/content/interview`
- **Function:** `getGameContent('interview')` from `src/lib/api.ts`
- **Fallback:** Hardcoded questions in component if API fails

### Content Structure
```javascript
{
  content_id: "uuid",              // Database ID for tracking
  game_type: "interview",
  questions: [
    {
      id: "q1",
      question: "Tell me about a time you failed...",
      time_limit: 300               // Optional, defaults to 300 seconds
    },
    // ... more questions
  ]
}
```

### Fallback Questions
- **Location:** `src/pages/games/Interview.tsx` (lines 75-80)
- **Count:** 4 questions
- **Content ID:** `'fallback-interview-1'`
- **Questions:**
  1. "Tell me about a time you failed and what you learned from it."
  2. "Describe a situation where you had to motivate a team. What was the outcome?"
  3. "How do you handle constructive criticism?"
  4. "Walk me through a complex problem you solved. What was your process?"

### Timer Configuration
- **Time Per Question:** 300 seconds (5 minutes)
- **Timer Resets:** Yes, for each question (using `key={currentQuestionIndex}`)
- **Total Game Time:** ~20 minutes (4 questions × 5 minutes)

### Game Flow
1. **Loading State** → Fetches questions from backend
2. **Instructions Screen** → Shows interview format
3. **Start Button** → User clicks to begin
4. **Question Screen** → 4 questions, 5 minutes each
5. **Results Screen** → Shows AI-evaluated scores

## Data Submission

### API Endpoint
- **Function:** `submitAIGame('interview', responseData, userId, contentId)`
- **Location:** `src/lib/api.ts` → `submitAIGame()`
- **Endpoint:** `POST /api/ai/submit-game`
- **Backend Game Type:** `interview` (but backend may treat as `scenario_challenge`)

### Submission Format
```javascript
{
  game_type: "interview",
  user_id: "uuid",
  content_id: "uuid",              // Optional: which question set was used
  response_data: {
    responses: [
      {
        question_id: "q1",
        question_text: "Tell me about a time you failed...",
        response_text: "User's detailed answer...",
        time_taken: 120.5           // Seconds
      },
      // ... more responses
    ]
  }
}
```

### Data Collection
- **Time Tracking:** Records `time_taken` for each question from `questionStartTime`
- **Response Text:** User's typed response (can be empty on timeout)
- **Content ID:** Tracks which question set was used
- **Timeout Handling:** If timer expires, records `response_text: ''` and `time_taken: 300`

## Scoring System

### Score Retrieval
- **Primary Source:** Backend AI API response
- **Response Format:**
  ```javascript
  {
    session_id: "uuid",
    version_used: "V1",
    ai_scores: {
      resilience: 85,
      leadership: 80,
      growth_mindset: 90,
      problem_solving: 75
    },
    final_scores: {
      final_score: 82.5,
      competencies: {
        resilience: { raw: 85, weight: 0.XX, weighted: XX },
        leadership: { raw: 80, weight: 0.XX, weighted: XX },
        growth_mindset: { raw: 90, weight: 0.XX, weighted: XX },
        problem_solving: { raw: 75, weight: 0.XX, weighted: XX }
      }
    }
  }
  ```

### Fallbacks
- **No Frontend Scoring:** This game relies entirely on backend AI scoring
- **Error Handling:** If backend fails, shows alert with error message
- **No Local Storage:** No fallback scores stored locally
- **Question Fallback:** Uses hardcoded questions if content API fails

### Competencies Tested (AI-Evaluated)
1. **Resilience** (weight varies by config)
   - **Evaluation:** AI analyzes ability to bounce back from failure
   - **Backend Logic:** Uses AI (Google Gemini) to evaluate resilience indicators

2. **Leadership** (weight varies by config)
   - **Evaluation:** AI analyzes leadership qualities and team motivation
   - **Backend Logic:** AI evaluates leadership skills and examples

3. **Growth Mindset** (weight varies by config)
   - **Evaluation:** AI analyzes openness to learning and improvement
   - **Backend Logic:** AI evaluates growth-oriented thinking

4. **Problem-Solving** (weight varies by config)
   - **Evaluation:** AI analyzes problem-solving approach and outcomes
   - **Backend Logic:** AI evaluates analytical and solution-oriented thinking

### Final Score Calculation
```
Final Score = (
  Resilience × weight +
  Leadership × weight +
  Growth Mindset × weight +
  Problem-Solving × weight
)
```
*Weights are configured in backend scoring configuration*

## Backend Integration

### Expected Backend Behavior
1. **Receives:** Array of interview responses with timing data
2. **AI Evaluation:** Uses AI (Google Gemini) to evaluate each response
3. **Calculates:** Competency scores from AI evaluation
4. **Returns:** Complete score breakdown with `session_id` and `version_used`

### Backend Configuration
- **Scoring Version:** Retrieved from backend (stored in `version_used`)
- **Active Config:** Backend uses active scoring configuration for this game type
- **Config Endpoint:** `GET /api/scoring/active/interview`
- **AI Provider:** Backend uses Google Gemini API (or mock if no API key)

### Content Management
- **Content Endpoint:** `GET /api/content/interview`
- **Content Storage:** Backend stores questions in `game_content` table
- **Content ID Tracking:** Frontend sends `content_id` to track which question set was used

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
- **Game Component:** `src/pages/games/Interview.tsx`
- **API Client:** `src/lib/api.ts` (submitAIGame, getGameContent functions)
- **Score Display:** `src/components/ScoreDisplay.tsx`
- **Transformers:** `src/lib/transformers.ts`
- **Types:** `src/lib/types.ts`

### Backend Endpoints
- **Submit:** `POST /api/ai/submit-game`
- **Get Content:** `GET /api/content/interview`
- **Get Config:** `GET /api/scoring/active/interview`
- **Get History:** `GET /api/games/results/interview`
- **Get Versions:** `GET /api/scoring/versions/interview`

## Notes for Backend Development

1. **Content Source:** Questions come from database via `/api/content/interview`
2. **AI Evaluation:** Backend must use AI (Google Gemini) to evaluate responses
3. **Content ID:** Frontend sends `content_id` - backend should track this
4. **Response Format:** Frontend sends array of responses - backend evaluates each
5. **Time Tracking:** Frontend sends `time_taken` for each response
6. **Scoring Dependency:** Frontend has no fallback scoring - must rely on backend AI
7. **Session Creation:** Backend creates session on submission
8. **Version Tracking:** Backend should return `version_used` for transparency
9. **AI Fallback:** Backend should have mock AI scoring if API key unavailable
10. **Multiple Responses:** Backend evaluates all responses in a single session
11. **Game Type Note:** Frontend sends `interview` but backend may treat as `scenario_challenge`

## Testing Considerations

- **Content Loading:** Test with/without backend content API
- **AI Evaluation:** Test AI scoring with various response qualities
- **Timeout Scenarios:** Test when user doesn't answer in time
- **Empty Responses:** Test handling of empty response text
- **Multiple Questions:** Test evaluation of multiple responses
- **Backend Failures:** Test error handling when API fails
- **Score Validation:** Verify all 4 competencies are evaluated correctly
- **Content Tracking:** Verify `content_id` is properly tracked

