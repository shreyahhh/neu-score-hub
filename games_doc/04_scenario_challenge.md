# Scenario Challenge - Complete Documentation

## Game Overview
**Game Type:** `scenario_challenge`  
**Component:** `src/pages/games/ScenarioChallenge.tsx`  
**Route:** `/games/scenario-challenge`  
**Status:** ✅ Fully Implemented

## Game Configuration

### Questions/Scenarios
- **Source:** Backend database via API
- **API Endpoint:** `GET /api/content/scenario_challenge`
- **Function:** `getGameContent('scenario_challenge')` from `src/lib/api.ts`
- **Fallback:** Hardcoded scenario in component if API fails

### Content Structure
```javascript
{
  content_id: "uuid",              // Database ID for tracking
  game_type: "scenario_challenge",
  scenario: "During Monday's team meeting...",  // Scenario text
  questions: [
    {
      id: "q1",
      question: "What could be Raj's reasons...",
      time_limit: 120               // Optional, defaults to 120 seconds
    },
    // ... more questions
  ]
}
```

### Fallback Scenario
- **Location:** `src/pages/games/ScenarioChallenge.tsx` (lines 89-115)
- **Trigger:** When backend API fails
- **Content ID:** `'fallback-scenario-1'`
- **Questions:** 4 hardcoded questions

### Timer Configuration
- **Time Per Question:** 120 seconds (2 minutes)
- **Timer Resets:** Yes, for each question (using `key={currentQuestionIndex}`)
- **Total Game Time:** ~8 minutes (4 questions × 2 minutes)

### Game Flow
1. **Loading State** → Fetches scenario from backend
2. **Instructions Screen** → Shows scenario description
3. **Start Button** → User clicks to begin
4. **Question Screen** → Multiple questions, 2 minutes each
5. **Results Screen** → Shows AI-evaluated scores

## Data Submission

### API Endpoint
- **Function:** `submitAIGame('scenario_challenge', responseData, userId, contentId)`
- **Location:** `src/lib/api.ts` → `submitAIGame()`
- **Endpoint:** `POST /api/ai/submit-game`
- **Backend Game Type:** `scenario_challenge`

### Submission Format
```javascript
{
  game_type: "scenario_challenge",
  user_id: "uuid",
  content_id: "uuid",              // Optional: which scenario was used
  response_data: {
    scenario_text: "During Monday's team meeting, Raj interrupted Asha...",  // Scenario description
    user_response: "User's detailed response...",  // Combined response for all questions
    question_text: "What could be Raj's reasons...",  // Last question text (for reference)
    response_text: "User's detailed response...",  // Alias for compatibility
    response_length: 250,           // Character count
    time_taken: 45.2,               // Average time per question (seconds)
    time_per_question: [45.2, 50.1, 40.3, 48.5]  // Array of times for each question
  }
}
```

**Note:** For multiple questions, all responses are combined into a single `user_response` string with format:
```
Question 1: [question text]

Answer: [user response]

Question 2: [question text]

Answer: [user response]
...
```

### Data Collection
- **Time Tracking:** Records `time_taken` for each question from `questionStartTime`
- **Response Text:** User's typed response (can be empty on timeout)
- **Content ID:** Tracks which scenario/question set was used
- **Timeout Handling:** If timer expires, records `user_response: ''` and `time_taken: 120`
- **Combined Response:** Multiple question responses are combined into single `user_response` string
- **Response Length:** Calculated as character count of combined response
- **Time Per Question:** Array of individual question times for backend analysis

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
      decision_making: 80,
      empathy: 90,
      creativity: 75,
      communication: 88
    },
    final_scores: {
      final_score: 83.6,
      competencies: {
        reasoning: { raw: 85, weight: 0.XX, weighted: XX },
        decision_making: { raw: 80, weight: 0.XX, weighted: XX },
        empathy: { raw: 90, weight: 0.XX, weighted: XX },
        creativity: { raw: 75, weight: 0.XX, weighted: XX },
        communication: { raw: 88, weight: 0.XX, weighted: XX }
      }
    }
  }
  ```

### Fallbacks
- **No Frontend Scoring:** This game relies entirely on backend AI scoring
- **Error Handling:** If backend fails, shows alert with error message
- **No Local Storage:** No fallback scores stored locally
- **Content Fallback:** Uses hardcoded scenario if content API fails

### Competencies Tested (AI-Evaluated)
1. **Reasoning** (weight varies by config)
   - **Evaluation:** AI analyzes logical thinking and problem-solving
   - **Backend Logic:** Uses AI (Google Gemini) to evaluate response quality

2. **Decision Making** (weight varies by config)
   - **Evaluation:** AI analyzes decision-making process and outcomes
   - **Backend Logic:** AI evaluates how well user makes decisions

3. **Empathy** (weight varies by config)
   - **Evaluation:** AI analyzes understanding of others' perspectives
   - **Backend Logic:** AI evaluates emotional intelligence

4. **Creativity** (weight varies by config)
   - **Evaluation:** AI analyzes creative and innovative thinking
   - **Backend Logic:** AI evaluates originality and novel approaches

5. **Communication** (weight varies by config)
   - **Evaluation:** AI analyzes clarity and effectiveness of communication
   - **Backend Logic:** AI evaluates how well user communicates ideas

### Final Score Calculation
```
Final Score = (
  Reasoning × weight +
  Decision Making × weight +
  Empathy × weight +
  Creativity × weight +
  Communication × weight
)
```
*Weights are configured in backend scoring configuration*

## Backend Integration

### Expected Backend Behavior
1. **Receives:** Single response object with `scenario_text` and `user_response` (combined for multiple questions)
2. **AI Evaluation:** Uses AI (Google Gemini) to evaluate the response based on scenario
3. **Extracts Variables:** Backend extracts scoring variables from response:
   - `response_text` / `user_response`: The user's combined response
   - `response_length`: Character count
   - `number_of_perspectives`: Extracted from response analysis
   - `depth_of_analysis`: Evaluated by AI
   - `logical_consistency`: Evaluated by AI
   - `creativity_score`: Evaluated by AI
   - `consideration_of_consequences`: Evaluated by AI
   - `communication_clarity`: Evaluated by AI
   - `grammar_score`: Evaluated by AI
   - `time_per_question`: From frontend array
4. **Calculates:** Competency scores using configured formulae with extracted variables
5. **Returns:** Complete score breakdown with `session_id` and `version_used`

### Backend Configuration
- **Scoring Version:** Retrieved from backend (stored in `version_used`)
- **Active Config:** Backend uses active scoring configuration for this game type
- **Config Endpoint:** `GET /api/scoring/active/scenario_challenge`
- **AI Provider:** Backend uses Google Gemini API (or mock if no API key)

### Content Management
- **Content Endpoint:** `GET /api/content/scenario_challenge`
- **Content Storage:** Backend stores scenarios in `game_content` table
- **Content ID Tracking:** Frontend sends `content_id` to track which scenario was used

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
- **Game Component:** `src/pages/games/ScenarioChallenge.tsx`
- **API Client:** `src/lib/api.ts` (submitAIGame, getGameContent functions)
- **Score Display:** `src/components/ScoreDisplay.tsx`
- **Transformers:** `src/lib/transformers.ts`
- **Types:** `src/lib/types.ts`
- **Fallback Data:** `src/data/scenarioQuestions.ts` (not used, legacy)

### Backend Endpoints
- **Submit:** `POST /api/ai/submit-game`
- **Get Content:** `GET /api/content/scenario_challenge`
- **Get Config:** `GET /api/scoring/active/scenario_challenge`
- **Get History:** `GET /api/games/results/scenario_challenge`
- **Get Versions:** `GET /api/scoring/versions/scenario_challenge`

## Notes for Backend Development

1. **Content Source:** Scenarios come from database via `/api/content/scenario_challenge`
2. **AI Evaluation:** Backend must use AI (Google Gemini) to evaluate responses
3. **Content ID:** Frontend sends `content_id` - backend should track this
4. **Response Format:** Frontend sends `scenario_text` and `user_response` (combined for multiple questions)
5. **Time Tracking:** Frontend sends `time_taken` (average) and `time_per_question` (array)
6. **Scoring Dependency:** Frontend has no fallback scoring - must rely on backend AI
7. **Session Creation:** Backend creates session on submission
8. **Version Tracking:** Backend should return `version_used` for transparency
9. **AI Fallback:** Backend should have mock AI scoring if API key unavailable
10. **Multiple Questions:** Backend receives combined response - should evaluate based on `scenario_text` and `user_response`
11. **Backend Variables:** Backend expects these variables for scoring:
    - `response_text` / `user_response`
    - `response_length`
    - `number_of_perspectives`
    - `depth_of_analysis`
    - `logical_consistency`
    - `creativity_score`
    - `consideration_of_consequences`
    - `communication_clarity`
    - `grammar_score`
    - `time_per_question`
12. **Format Match:** Frontend now sends format matching backend test: `{ scenario_text, user_response }`

## Testing Considerations

- **Content Loading:** Test with/without backend content API
- **AI Evaluation:** Test AI scoring with various response qualities
- **Timeout Scenarios:** Test when user doesn't answer in time
- **Empty Responses:** Test handling of empty response text
- **Multiple Questions:** Test evaluation of multiple responses
- **Backend Failures:** Test error handling when API fails
- **Score Validation:** Verify all 5 competencies are evaluated correctly
- **Content Tracking:** Verify `content_id` is properly tracked

