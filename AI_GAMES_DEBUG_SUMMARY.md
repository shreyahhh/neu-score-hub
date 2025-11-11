# AI Games Debugging - Summary of Changes

## Issues Fixed

### 1. Inconsistent Result Checking
**Problem**: Games were checking for different response formats (`result.scores` vs `result.final_scores`)

**Fix**: Updated all AI games to check for both formats:
- `result.final_scores` (AI games)
- `result.scores` (action games)
- `result.session_id` (fallback check)

**Files Changed**:
- `src/pages/games/DebateMode.tsx`
- `src/pages/games/CreativeUses.tsx`
- `src/pages/games/ScenarioChallenge.tsx`
- `src/pages/games/Interview.tsx`

### 2. Missing Error Logging
**Problem**: Limited visibility into what was happening during API calls

**Fix**: Added comprehensive logging:
- Request URLs and payloads
- Response status and bodies
- Error details with stack traces
- Step-by-step logging with `[functionName]` prefixes

**Files Changed**:
- `src/lib/api.ts` - Enhanced `submitAIGame()` and `getGameContent()`
- All AI game components - Added detailed logging

### 3. Poor Error Messages
**Problem**: Generic error messages that didn't help debug

**Fix**: Added detailed error messages that show:
- What went wrong
- What data was sent/received
- Full error stack traces
- Instructions to check console

## How to Debug Now

### Step 1: Open Browser Console
1. Press `F12` or `Ctrl+Shift+I`
2. Go to **Console** tab
3. Keep it open while playing games

### Step 2: Play an AI Game
1. Navigate to any AI game (Debate, Scenario, Creative Uses, Interview)
2. Complete the game
3. Watch the console for log messages

### Step 3: Look for These Logs

#### When Game Loads:
```
[getGameContent] Fetching content from: http://localhost:3000/api/content/ai_debate
[getGameContent] Response status: 200 OK
[getGameContent] Response body: {...}
Fetched debate content from database: {...}
```

#### When Submitting:
```
Submitting debate game with data: { gameType: 'ai_debate', responseData: {...}, contentId: '...' }
[submitAIGame] Sending request to: http://localhost:3000/api/ai/submit-game
[submitAIGame] Request body: {...}
[submitAIGame] Response status: 200 OK
[submitAIGame] Response body: {...}
Debate game result from backend: {...}
```

### Step 4: Check Network Tab
1. Go to **Network** tab in DevTools
2. Filter by "Fetch/XHR"
3. Look for:
   - `GET /api/content/[game_type]` - Content loading
   - `POST /api/ai/submit-game` - Game submission

4. Click on each request to see:
   - **Headers**: Request/response headers
   - **Payload**: What data was sent
   - **Response**: What backend returned

### Step 5: Verify Backend Response

The backend should return:
```json
{
  "success": true,
  "data": {
    "session_id": "uuid-here",
    "version_used": "v1.0",
    "final_scores": {
      "final_score": 75.5,
      "competencies": {
        "reasoning": { "raw": 80, "weight": 0.4, "weighted": 32 },
        "analysis": { "raw": 70, "weight": 0.6, "weighted": 42 }
      }
    }
  }
}
```

### Step 6: Common Issues to Check

#### Backend Not Running
- **Symptom**: Network error, connection refused
- **Fix**: Start backend server

#### Wrong API URL
- **Symptom**: 404 errors, wrong endpoint
- **Fix**: Check `VITE_API_BASE_URL` in `.env` file

#### CORS Error
- **Symptom**: CORS policy error in console
- **Fix**: Check backend CORS settings

#### Wrong Request Format
- **Symptom**: 400 Bad Request
- **Fix**: Check request payload in Network tab, compare with backend expectations

#### Backend Error
- **Symptom**: 500 Internal Server Error
- **Fix**: Check backend logs for errors

#### No Scores Returned
- **Symptom**: "Invalid result from backend"
- **Fix**: Check response in Network tab, verify `final_scores` or `scores` exists

#### Session Not Saved
- **Symptom**: No entry in database
- **Fix**: Check backend database connection and insert logic

## What Information to Share

When reporting issues, please provide:

1. **Console Logs** (copy/paste or screenshot)
   - Look for `[submitAIGame]` and `[getGameContent]` logs
   - Include any error messages

2. **Network Request Details** (screenshot)
   - Request URL
   - Request payload (Payload tab)
   - Response status
   - Response body (Response tab)

3. **Backend Logs** (if accessible)
   - Any errors or warnings
   - Database connection issues

4. **Environment Info**:
   - Frontend URL (e.g., `http://localhost:5173`)
   - Backend URL (e.g., `http://localhost:3000`)
   - Database type (Supabase, PostgreSQL, etc.)

5. **Game Details**:
   - Which game failed (Debate, Scenario, etc.)
   - What actions you took
   - When the error occurred

## Next Steps

1. **Test the changes**:
   - Play each AI game
   - Check console for logs
   - Verify scores are displayed
   - Check database for saved sessions

2. **If issues persist**:
   - Follow the debugging checklist (`DEBUG_CHECKLIST.md`)
   - Collect the information above
   - Share the details for further investigation

3. **Verify backend**:
   - Check backend is running
   - Verify API endpoints exist
   - Check database connections
   - Verify scoring configuration exists

## Files Changed

- `src/lib/api.ts` - Enhanced logging and error handling
- `src/pages/games/DebateMode.tsx` - Fixed result checking, added logging
- `src/pages/games/CreativeUses.tsx` - Fixed result checking, added logging
- `src/pages/games/ScenarioChallenge.tsx` - Fixed result checking, added logging
- `src/pages/games/Interview.tsx` - Fixed result checking, added logging
- `DEBUG_AI_GAMES.md` - Detailed debugging guide
- `DEBUG_CHECKLIST.md` - Quick debugging checklist
- `AI_GAMES_DEBUG_SUMMARY.md` - This file

## Testing Checklist

- [ ] Play Debate Mode game
- [ ] Play Scenario Challenge game
- [ ] Play Creative Uses game
- [ ] Play Interview game
- [ ] Check console for logs
- [ ] Check Network tab for requests
- [ ] Verify scores are displayed
- [ ] Check database for saved sessions
- [ ] Verify no errors in console

## Questions to Answer

1. **Is the backend running?**
   - Test: `curl http://localhost:3000/api/health` (or similar)

2. **Is the API URL correct?**
   - Check: `.env` file has `VITE_API_BASE_URL=http://localhost:3000`

3. **Does the backend endpoint exist?**
   - Check: Backend has `/api/ai/submit-game` endpoint

4. **Is the request format correct?**
   - Check: Network tab shows correct payload structure

5. **Is the response format correct?**
   - Check: Network tab shows `{ success: true, data: {...} }`

6. **Are scores being calculated?**
   - Check: Backend logs show scoring process
   - Check: Response includes `final_scores`

7. **Is the session being saved?**
   - Check: Database has new entry in `game_sessions` table

If you can answer these questions, we can pinpoint the exact issue!

