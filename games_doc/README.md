# Games Documentation Index

This directory contains comprehensive documentation for each game in the NeuRazor platform. Each document provides complete information about game configuration, data sources, scoring logic, competencies, API endpoints, fallbacks, and backend integration details.

## Document Structure

Each game documentation file follows this structure:
1. **Game Overview** - Basic information and status
2. **Game Configuration** - Questions, timers, game flow
3. **Data Submission** - API endpoints, submission format, data collection
4. **Scoring System** - Score retrieval, fallbacks, competencies, formulae
5. **Backend Integration** - Expected behavior, configuration, key data points
6. **Frontend Display** - Score display component and format
7. **Key Files Reference** - All relevant frontend and backend files
8. **Notes for Backend Development** - Important implementation details
9. **Testing Considerations** - Test scenarios and validation points

## Games Documentation

### ✅ Implemented Games

1. **[Mental Math Sprint](01_mental_math_sprint.md)**
   - **Type:** `mental_math_sprint`
   - **Questions:** Hardcoded (10 problems)
   - **Scoring:** Backend only
   - **Competencies:** Accuracy, Speed, Quantitative Aptitude, Mental Stamina

2. **[Stroop Test](02_stroop_test.md)**
   - **Type:** `stroop_test`
   - **Questions:** Generated programmatically (10 questions)
   - **Scoring:** Backend only
   - **Competencies:** Cognitive Flexibility, Cognitive Agility, Accuracy, Speed

3. **[Pattern Sudoku](03_pattern_sudoku.md)**
   - **Type:** `sign_sudoku`
   - **Puzzles:** Hardcoded in data file (3 difficulty levels)
   - **Scoring:** Backend only
   - **Competencies:** Accuracy, Reasoning, Attention to Detail, Speed, Math

4. **[Scenario Challenge](04_scenario_challenge.md)**
   - **Type:** `scenario_challenge`
   - **Content:** Backend database (with fallback)
   - **Scoring:** Backend AI (Google Gemini)
   - **Competencies:** Reasoning, Decision Making, Empathy, Creativity, Communication

5. **[Creative Uses](05_creative_uses.md)**
   - **Type:** `creative_uses`
   - **Content:** Backend database (with fallback)
   - **Scoring:** Backend AI (Google Gemini)
   - **Competencies:** Creativity, Speed

6. **[Interview Challenge](06_interview.md)**
   - **Type:** `interview`
   - **Content:** Backend database (with fallback)
   - **Scoring:** Backend AI (Google Gemini)
   - **Competencies:** Resilience, Leadership, Growth Mindset, Problem-Solving

7. **[Card Flip Challenge](07_card_flip_challenge.md)**
   - **Type:** `card_flip_challenge`
   - **Patterns:** Rotation system (4 patterns)
   - **Scoring:** Backend (with frontend fallback)
   - **Competencies:** Pattern Recognition, Accuracy, Speed, Strategy

8. **[AI Debate (Debate Mode)](08_ai_debate.md)**
   - **Type:** `ai_debate`
   - **Content:** Backend database (with fallback)
   - **Scoring:** Backend AI (Google Gemini)
   - **Competencies:** Reasoning, Communication, Cognitive Agility, Holistic Analysis

## Common Patterns

### Score Retrieval
- **Action Games** (Mental Math, Stroop, Sudoku, Card Flip): Use `POST /api/games/submit`
- **AI Games** (Scenario, Creative Uses, Interview): Use `POST /api/ai/submit-game`
- **Response Format:** All games return `{ session_id, version_used, scores: {...} }`

### Fallbacks
- **Content Fallbacks:** AI games have hardcoded fallback content if API fails
- **Scoring Fallbacks:** Card Flip has frontend scoring fallback; others rely on backend
- **Error Handling:** All games show alerts if backend fails

### Content Management
- **Hardcoded:** Mental Math, Stroop, Sudoku, Card Flip
- **Database:** Scenario Challenge, Creative Uses, Interview
- **Content API:** `GET /api/content/{game_type}` for database games

### Scoring Configuration
- **Config Endpoint:** `GET /api/scoring/active/{game_type}`
- **Version Tracking:** All games return `version_used` in response
- **Weights:** Configured in backend scoring configuration

## Backend Integration Checklist

When implementing backend for a game, ensure:

- [ ] API endpoint matches game type
- [ ] Receives data in expected format
- [ ] Calculates all competencies correctly
- [ ] Returns scores in expected format
- [ ] Includes `session_id` and `version_used`
- [ ] Handles content retrieval (if applicable)
- [ ] Supports AI evaluation (if applicable)
- [ ] Tracks `content_id` (if applicable)
- [ ] Validates data format
- [ ] Handles errors gracefully

## API Endpoints Summary

### Game Submission
- **Action Games:** `POST /api/games/submit`
- **AI Games:** `POST /api/ai/submit-game`

### Content Retrieval
- **Get Content:** `GET /api/content/{game_type}`
- **Get Scores (Preview):** `POST /api/ai/score` (AI games only)

### Scoring Configuration
- **Get Active Config:** `GET /api/scoring/active/{game_type}`
- **Get All Versions:** `GET /api/scoring/versions/{game_type}`
- **Set Active Version:** `POST /api/scoring/set-active`
- **Save New Config:** `POST /api/scoring/save`

### Results
- **Get History:** `GET /api/games/results/{game_type}`

## Data Flow

1. **Game Start:** Frontend loads content (if needed)
2. **Gameplay:** Frontend collects user responses
3. **Game End:** Frontend submits data to backend
4. **Scoring:** Backend calculates scores
5. **Response:** Backend returns scores
6. **Display:** Frontend shows results

## Notes

- All games use `DEFAULT_USER_ID` from `src/lib/api.ts` if no user context
- All scores are 0-100 scale
- All timers are in seconds
- All API responses should include `success: true` and `data: {...}`
- Frontend transforms backend responses using `transformGameResult()`

## Questions?

Refer to individual game documentation files for detailed information about each game's specific implementation, scoring logic, and backend requirements.

