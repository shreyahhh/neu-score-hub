# Quick Debugging Checklist for AI Games

## Step 1: Verify Environment Setup

- [ ] Check if `.env` file exists in project root
- [ ] Verify `VITE_API_BASE_URL` is set correctly (e.g., `http://localhost:3000`)
- [ ] Restart dev server after changing `.env` file
- [ ] Verify backend server is running on the correct port

## Step 2: Open Browser DevTools

1. Open your browser
2. Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
3. Go to **Console** tab
4. Go to **Network** tab

## Step 3: Test an AI Game

1. Play one of these games:
   - Debate Mode (`/games/debate-mode`)
   - Scenario Challenge (`/games/scenario-challenge`)
   - Creative Uses (`/games/creative-uses`)
   - Interview (`/games/interview`)

## Step 4: Check Console Logs

Look for these log messages (they should appear in order):

### When game loads:
- `[getGameContent] Fetching content from: http://localhost:3000/api/content/[game_type]`
- `[getGameContent] Response status: 200 OK`
- `[getGameContent] Response body: {...}`
- `Fetched [game] content from database: {...}`

### When submitting:
- `Submitting [game] with data: {...}`
- `[submitAIGame] Sending request to: http://localhost:3000/api/ai/submit-game`
- `[submitAIGame] Request body: {...}`
- `[submitAIGame] Response status: 200 OK`
- `[submitAIGame] Response body: {...}`
- `[game] result from backend: {...}`

## Step 5: Check Network Tab

1. Filter by "Fetch/XHR"
2. Look for these requests:
   - `GET /api/content/[game_type]` - Should return 200
   - `POST /api/ai/submit-game` - Should return 200

### For Content Request:
- Click on the request
- Check **Response** tab
- Should see: `{ "success": true, "data": {...} }`

### For Submit Request:
- Click on the request
- Check **Payload** tab - verify data format
- Check **Response** tab - should see: `{ "success": true, "data": { "session_id": "...", "final_scores": {...} } }`

## Step 6: Common Issues

### Issue: "Failed to fetch"
- **Cause**: Backend not running or wrong URL
- **Fix**: Check backend is running, verify `VITE_API_BASE_URL`

### Issue: "CORS error"
- **Cause**: Backend not allowing frontend origin
- **Fix**: Check backend CORS settings

### Issue: "404 Not Found"
- **Cause**: Wrong endpoint URL
- **Fix**: Verify backend has `/api/ai/submit-game` endpoint

### Issue: "400 Bad Request"
- **Cause**: Wrong request format
- **Fix**: Check request payload matches backend expectations

### Issue: "500 Internal Server Error"
- **Cause**: Backend error
- **Fix**: Check backend logs

### Issue: "Invalid result from backend"
- **Cause**: Backend not returning expected format
- **Fix**: Check response structure in Network tab

## Step 7: Verify Database

Check if session was saved:
1. Connect to your database
2. Query `game_sessions` table
3. Look for recent entry with your `user_id`
4. Verify `game_type` matches

## Step 8: Collect Debug Information

When reporting issues, provide:

1. **Console Errors** (screenshot)
2. **Network Request** (screenshot of request/response)
3. **Backend Logs** (if accessible)
4. **Environment**:
   - Frontend URL
   - Backend URL
   - Database type
5. **Game Type** that failed
6. **Steps to Reproduce**

## Quick Test

Run this in browser console to test API connection:

```javascript
// Test API connection
fetch('http://localhost:3000/api/ai/submit-game', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    game_type: 'ai_debate',
    user_id: '53f77b43-d71a-4edf-8b80-c70b975264d8',
    response_data: {
      debate_statement: 'Test',
      pros_text: 'Test pros',
      cons_text: 'Test cons',
      pros_time_taken: 90,
      cons_time_taken: 90
    }
  })
})
.then(r => r.json())
.then(d => console.log('Success:', d))
.catch(e => console.error('Error:', e));
```

If this works, the API is accessible. If not, check backend.

