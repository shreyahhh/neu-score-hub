# Scenario Challenge - Debugging Guide

## Issue
Questions are not being fetched from database, falling back to hardcoded questions.

## Testing Steps

### 1. Test Backend Content API

```bash
# Test if backend returns content correctly
curl -X GET "http://localhost:3000/api/content/scenario_challenge" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "content_id": "scenario-xxx",
    "game_type": "scenario_challenge",
    "scenario": "...",
    "questions": [
      {
        "id": "q1",
        "question": "...",
        "time_limit": 120
      }
    ]
  }
}
```

### 2. Test Frontend API Call

Open browser DevTools Console and check for:
- `[getGameContent] Fetching content from: ...`
- `[getGameContent] Response status: ...`
- `[getGameContent] Response body: ...`
- `[getGameContent] Parsed result: ...`
- `[getGameContent] Returning data: ...`
- `Fetched content from database: ...`

### 3. Check for Errors

Look for these console errors:
- `Failed to load scenario from database:`
- `Invalid scenario data from database`
- `contentData is null or undefined`
- `Scenario text missing from database response`
- `Questions array missing from database response`
- `Questions is not an array`
- `Questions array is empty`

### 4. Verify Data Structure

Check the console log `Fetched content from database:` and verify:
- `contentData.scenario` exists and is a string
- `contentData.questions` exists and is an array
- `contentData.questions.length > 0`
- Each question has `id` and `question` fields

### 5. Network Tab Check

1. Open DevTools → Network tab
2. Filter by "scenario_challenge"
3. Check the request to `/api/content/scenario_challenge`
4. Verify:
   - Status: 200 OK
   - Response contains `success: true`
   - Response contains `data` object
   - `data.scenario` exists
   - `data.questions` is an array with items

## Common Issues

### Issue 1: API Returns Wrong Format
**Symptom:** Console shows "Invalid scenario data from database"

**Check:**
```bash
curl -X GET "http://localhost:3000/api/content/scenario_challenge" | jq '.data'
```

**Fix:** Ensure backend returns `{ success: true, data: { scenario, questions } }`

### Issue 2: CORS Error
**Symptom:** Network tab shows CORS error

**Fix:** Check backend CORS configuration allows frontend origin

### Issue 3: API_BASE_URL Wrong
**Symptom:** Request goes to wrong URL

**Check:** Browser console shows `[getGameContent] API_BASE_URL: ...`

**Fix:** Check `.env` file has correct `VITE_API_BASE_URL`

### Issue 4: Questions Array Empty
**Symptom:** Console shows "Questions array is empty"

**Check:**
```bash
curl -X GET "http://localhost:3000/api/content/scenario_challenge" | jq '.data.questions | length'
```

**Fix:** Ensure database has questions for scenario_challenge

### Issue 5: Response Parsing Error
**Symptom:** Console shows "Failed to parse response as JSON"

**Check:** Network tab → Response → Preview tab
- Is it valid JSON?
- Does it have `success` and `data` fields?

## Debugging Commands

### Check Backend Content Endpoint
```bash
# Get content
curl -X GET "http://localhost:3000/api/content/scenario_challenge" \
  -H "Content-Type: application/json" | jq '.'

# Check if questions exist
curl -X GET "http://localhost:3000/api/content/scenario_challenge" \
  -H "Content-Type: application/json" | jq '.data.questions | length'

# Check question structure
curl -X GET "http://localhost:3000/api/content/scenario_challenge" \
  -H "Content-Type: application/json" | jq '.data.questions[0]'
```

### Test Submission Format
```bash
# Test submission (should match frontend format)
curl -X POST "http://localhost:3000/api/ai/submit-game" \
  -H "Content-Type: application/json" \
  -d '{
    "game_type": "scenario_challenge",
    "user_id": "53f77b43-d71a-4edf-8b80-c70b975264d8",
    "response_data": {
      "scenario_text": "You are leading a team...",
      "user_response": "Question 1: What factors would you consider?\n\nAnswer: I would consider...",
      "response_length": 150,
      "time_taken": 45.2,
      "time_per_question": [45.2, 50.1, 40.3, 48.5]
    }
  }' | jq '.'
```

### Check Scoring Variables
```bash
# Get active scoring config
curl -X GET "http://localhost:3000/api/scoring/active/scenario_challenge" \
  -H "Content-Type: application/json" | jq '.data.config.variables'
```

## Frontend Debug Checklist

1. ✅ Check browser console for `[getGameContent]` logs
2. ✅ Check Network tab for `/api/content/scenario_challenge` request
3. ✅ Verify response status is 200
4. ✅ Check response body has `success: true`
5. ✅ Verify `data.scenario` exists
6. ✅ Verify `data.questions` is an array
7. ✅ Check `data.questions.length > 0`
8. ✅ Verify each question has `id` and `question` fields
9. ✅ Check for any JavaScript errors in console
10. ✅ Verify `API_BASE_URL` is correct in `.env`

## What to Share for Debugging

1. **Browser Console Output:**
   - Copy all `[getGameContent]` logs
   - Copy any error messages
   - Copy the `Fetched content from database:` log

2. **Network Tab:**
   - Screenshot of `/api/content/scenario_challenge` request
   - Response Preview/Response tab content

3. **Backend Response:**
   ```bash
   curl -X GET "http://localhost:3000/api/content/scenario_challenge" | jq '.'
   ```

4. **Environment Variables:**
   - `VITE_API_BASE_URL` value from `.env`

## Expected Flow

1. Component mounts → `useEffect` runs
2. Calls `getGameContent('scenario_challenge')`
3. API function fetches from `/api/content/scenario_challenge`
4. Backend returns `{ success: true, data: { scenario, questions } }`
5. API function returns `result.data`
6. Frontend validates: `contentData.scenario` and `contentData.questions`
7. Frontend transforms to component format
8. Sets state with `setScenario(transformedScenario)`
9. Component renders with database content

## If Still Failing

1. **Check Backend Logs:**
   - Is the endpoint being called?
   - Any errors in backend console?
   - Is database query successful?

2. **Check Database:**
   - Are there records in `game_content` table?
   - Is `game_type = 'scenario_challenge'`?
   - Do records have `scenario` and `questions` fields?

3. **Test Direct API:**
   ```bash
   # Should return data
   curl http://localhost:3000/api/content/scenario_challenge
   ```

4. **Check CORS:**
   - Is frontend origin allowed?
   - Any CORS errors in console?

