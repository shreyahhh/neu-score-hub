# Deployment Scoring Debug Guide

## Issue: Score 0 on Deployed Site vs Working on Localhost

### Quick Diagnostic Steps

1. **Check Browser Console (Deployed Site)**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for:
     - `[API Config]` logs showing the API_BASE_URL
     - `[submitAIGame]` logs showing request/response
     - Any error messages or warnings
     - `⚠️ All scores are 0` warning

2. **Check Network Tab (Deployed Site)**
   - Open Developer Tools → Network tab
   - Submit a debate game
   - Look for the request to `/api/ai/submit-game`
   - Check:
     - **Request URL**: Is it pointing to the correct backend?
     - **Status Code**: 200 (success) or error?
     - **Response**: Click on the request → Response tab
     - Look for `ai_scores` and `final_scores` in the response

3. **Verify Environment Variables**

   **In your deployment platform (Vercel/Netlify/etc):**
   - Check if `VITE_API_BASE_URL` is set
   - It should point to your production backend URL (e.g., `https://api.yourdomain.com`)
   - **NOT** `http://localhost:3000`

   **How to check:**
   ```bash
   # In your deployment platform's environment variables section
   # Should have:
   VITE_API_BASE_URL=https://your-production-backend-url.com
   ```

4. **Check Backend Configuration**

   **In your production backend:**
   - Verify `GEMINI_API_KEY` is set in production environment
   - Check backend logs for AI scoring errors
   - Verify backend is accessible from your deployed frontend domain

## Common Root Causes

### 1. ❌ VITE_API_BASE_URL Not Set in Production

**Symptom:**
- Console shows: `[API Config] API_BASE_URL: http://localhost:3000`
- Network requests fail or timeout
- Score is 0

**Fix:**
- Set `VITE_API_BASE_URL` in your deployment platform's environment variables
- Point it to your production backend URL
- Rebuild and redeploy

### 2. ❌ Backend Gemini API Key Not Configured

**Symptom:**
- API calls succeed (200 status)
- Response contains `ai_scores` but all values are 0
- Backend logs show: "Using mock AI scores"

**Fix:**
- Set `GEMINI_API_KEY` in your production backend environment
- Restart backend server
- Test again

### 3. ❌ CORS Issues

**Symptom:**
- Network request shows CORS error in console
- Request fails with "CORS policy" error
- Status code might be 0 or failed

**Fix:**
- Update backend CORS configuration to allow your deployed frontend domain
- Add your frontend URL to allowed origins

### 4. ❌ Backend Not Accessible

**Symptom:**
- Network request fails/times out
- Status code: 0, ERR_FAILED, or timeout
- Console shows connection errors

**Fix:**
- Verify backend is running and accessible
- Check firewall/network settings
- Test backend URL directly in browser

## Step-by-Step Debugging

### Step 1: Check API Configuration
```javascript
// In browser console on deployed site:
console.log('API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
// Should show your production backend URL, NOT localhost
```

### Step 2: Test Backend Directly
```bash
# Test if backend is accessible
curl https://your-backend-url.com/api/health

# Test AI scoring endpoint
curl -X POST https://your-backend-url.com/api/ai/score \
  -H "Content-Type: application/json" \
  -d '{
    "game_type": "ai_debate",
    "response_data": {
      "topic": "Test topic",
      "user_argument": "Test argument"
    }
  }'
```

### Step 3: Check Backend Logs
- Look for AI scoring errors
- Check if Gemini API key is being used
- Verify request is reaching the backend

### Step 4: Compare Localhost vs Production

**Localhost (Working):**
- Check what `VITE_API_BASE_URL` is set to
- Check backend logs for successful AI scoring
- Note the response structure

**Production (Not Working):**
- Compare API_BASE_URL
- Compare backend responses
- Check for differences in environment

## Expected Response Format

When scoring works correctly, the backend should return:

```json
{
  "success": true,
  "message": "AI game submitted successfully",
  "data": {
    "session_id": "uuid",
    "version_used": "V1",
    "ai_scores": {
      "reasoning": 85,
      "communication": 80,
      "cognitive_agility": 90,
      "holistic_analysis": 88,
      "feedback": "Detailed feedback..."
    },
    "final_scores": {
      "final_score": 86.2,
      "competencies": {
        "reasoning": { "raw": 85, "weighted": 34, "weight": 0.4 },
        "communication": { "raw": 80, "weighted": 8, "weight": 0.1 },
        "cognitive_agility": { "raw": 90, "weighted": 18, "weight": 0.2 },
        "holistic_analysis": { "raw": 88, "weighted": 26.4, "weight": 0.3 }
      }
    }
  }
}
```

If `ai_scores` are all 0, the backend is likely using mock scores (Gemini API key not configured).

## Quick Fix Checklist

- [ ] `VITE_API_BASE_URL` is set in deployment platform
- [ ] `VITE_API_BASE_URL` points to production backend (not localhost)
- [ ] Backend `GEMINI_API_KEY` is set in production
- [ ] Backend CORS allows your frontend domain
- [ ] Backend is accessible from deployed frontend
- [ ] Rebuilt and redeployed after setting environment variables

## Still Not Working?

1. **Share these details:**
   - Browser console logs (especially `[API Config]` and `[submitAIGame]`)
   - Network tab screenshot of the `/api/ai/submit-game` request
   - Backend logs from production
   - Your deployment platform and how you set environment variables

2. **Test endpoints manually:**
   - Try the backend health check
   - Try the AI scoring endpoint directly
   - Compare responses between localhost and production

