# Debugging Guide for AI-Scored Games

## Issues Identified

1. **Inconsistent result checking**: Games check for different response formats (`result.scores` vs `result.final_scores`)
2. **Missing error logging**: Limited visibility into API errors
3. **No request/response logging**: Hard to see what's being sent/received
4. **Result transformation issues**: Some games pass raw results, some expect transformed

## How to Debug

### 1. Open Browser Developer Tools

**Steps:**
1. Open your browser (Chrome/Firefox/Edge)
2. Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
3. Go to the **Console** tab
4. Go to the **Network** tab

### 2. Check Console for Errors

**What to look for:**
- Red error messages
- API errors
- JavaScript errors
- Failed fetch requests

**Common errors:**
- `Failed to submit AI game: 400` - Bad request (check data format)
- `Failed to submit AI game: 500` - Server error
- `CORS error` - Backend not allowing frontend requests
- `Network error` - Backend not running or wrong URL

### 3. Check Network Tab

**Steps:**
1. Open Network tab in DevTools
2. Filter by "Fetch/XHR"
3. Play an AI game
4. Look for requests to `/api/ai/submit-game`
5. Click on the request to see details

**Check Request:**
- **URL**: Should be `http://localhost:3000/api/ai/submit-game` (or your API URL)
- **Method**: Should be `POST`
- **Headers**: Should include `Content-Type: application/json`
- **Payload**: Click "Payload" tab to see what data is being sent
  - Should have `game_type`, `response_data`, `user_id`
  - May have `content_id`

**Check Response:**
- **Status**: Should be `200 OK`
- **Response**: Click "Response" tab to see what backend returned
  - Should have `success: true`
  - Should have `data` with `session_id`, `version_used`, `final_scores` or `scores`

### 4. Verify Backend is Running

**Check:**
1. Is the backend server running?
2. What port is it running on? (default: 3000)
3. Check `.env` file for `VITE_API_BASE_URL`

### 5. Check Environment Variables

**File: `.env` or `.env.local`**
```
VITE_API_BASE_URL=http://localhost:3000
```

**Verify:**
- URL matches your backend URL
- No trailing slash
- HTTP vs HTTPS matches backend

### 6. Test API Endpoint Directly

**Using curl:**
```bash
curl -X POST http://localhost:3000/api/ai/submit-game \
  -H "Content-Type: application/json" \
  -d '{
    "game_type": "ai_debate",
    "user_id": "53f77b43-d71a-4edf-8b80-c70b975264d8",
    "response_data": {
      "debate_statement": "Test statement",
      "pros_text": "Test pros",
      "cons_text": "Test cons",
      "pros_time_taken": 90,
      "cons_time_taken": 90
    }
  }'
```

**Using Postman/Insomnia:**
1. Create POST request to `http://localhost:3000/api/ai/submit-game`
2. Set header: `Content-Type: application/json`
3. Set body (JSON):
```json
{
  "game_type": "ai_debate",
  "user_id": "53f77b43-d71a-4edf-8b80-c70b975264d8",
  "response_data": {
    "debate_statement": "Test statement",
    "pros_text": "Test pros",
    "cons_text": "Test cons",
    "pros_time_taken": 90,
    "cons_time_taken": 90
  }
}
```

### 7. Check Database

**Verify sessions are being saved:**
1. Check your database (Supabase/PostgreSQL)
2. Look at `game_sessions` table
3. Check for recent entries with your `user_id`
4. Verify `game_type` matches (e.g., `ai_debate`, `scenario_challenge`)

**Check scoring:**
1. Look at `scoring_configs` table
2. Verify active config exists for the game type
3. Check `scoring_versions` table for version history

### 8. Common Issues & Solutions

#### Issue: "Failed to submit game"
**Solution:**
- Check backend logs
- Verify API endpoint exists
- Check CORS settings
- Verify request format matches backend expectations

#### Issue: "Invalid result from backend"
**Solution:**
- Backend might not be returning `success: true`
- Check response structure matches expected format
- Verify backend is processing AI scoring correctly

#### Issue: "No scores displayed"
**Solution:**
- Check if `final_scores` or `scores` exists in response
- Verify `transformGameResult` is working
- Check browser console for transformation errors

#### Issue: "Session not saved to database"
**Solution:**
- Check backend database connection
- Verify backend is calling database insert
- Check database permissions
- Look for database errors in backend logs

## Information to Collect for Debugging

When reporting issues, please provide:

1. **Browser Console Errors** (screenshot or copy/paste)
2. **Network Request Details**:
   - Request URL
   - Request payload
   - Response status
   - Response body
3. **Backend Logs** (if accessible)
4. **Game Type** (ai_debate, scenario_challenge, creative_uses, interview)
5. **Steps to Reproduce**:
   - What game did you play?
   - What actions did you take?
   - When did the error occur?
6. **Environment**:
   - Frontend URL
   - Backend URL
   - Database type (Supabase, PostgreSQL, etc.)

## Enhanced Logging

The code has been updated to include better logging. Check browser console for:
- `Fetched [game] content from database:` - Content loading
- `Error submitting [game]:` - Submission errors
- `Invalid result from backend:` - Response format issues
- `API Error:` - API-level errors

## Next Steps

1. Run a test game
2. Check browser console
3. Check network tab
4. Share the information collected
5. We can then fix the specific issues

