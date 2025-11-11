// Central API Client for NeuRazor Backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Default test user ID (from backend documentation)
export const DEFAULT_USER_ID = '53f77b43-d71a-4edf-8b80-c70b975264d8';

/**
 * Submit game result for action-based games
 */
export async function submitGame(gameType: string, rawData: any, userId?: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/games/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_type: gameType,
        raw_data: rawData,
        user_id: userId || DEFAULT_USER_ID
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('API Error:', errorData);
      throw new Error(errorData.error || `Failed to submit game: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Backend returned an error');
    }
    return result.data;
  } catch (error) {
    console.error('Error submitting game:', error);
    throw error;
  }
}

/**
 * Submit AI-based game result (text games)
 * @param gameType - The game type identifier
 * @param responseData - The response data (should include content_id if available)
 * @param userId - Optional user ID
 * @param contentId - Optional content ID (which question/scenario was used)
 */
export async function submitAIGame(gameType: string, responseData: any, userId?: string, contentId?: string) {
  try {
    const requestBody: any = {
      game_type: gameType,
      response_data: responseData,
      user_id: userId || DEFAULT_USER_ID
    };

    // Include content_id if provided (for tracking which question was used)
    if (contentId) {
      requestBody.content_id = contentId;
    }

    const url = `${API_BASE_URL}/api/ai/submit-game`;
    console.log(`[submitAIGame] Sending request to: ${url}`);
    console.log(`[submitAIGame] Request body:`, JSON.stringify(requestBody, null, 2));
    console.log(`[submitAIGame] API_BASE_URL:`, API_BASE_URL);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    console.log(`[submitAIGame] Response status: ${response.status} ${response.statusText}`);
    console.log(`[submitAIGame] Response headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[submitAIGame] Error response body:`, errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'Unknown error' };
      }
      
      console.error('[submitAIGame] API Error:', errorData);
      throw new Error(errorData.error || errorData.message || `Failed to submit AI game: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log(`[submitAIGame] Response body:`, responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('[submitAIGame] Failed to parse response as JSON:', e);
      throw new Error(`Invalid JSON response from server: ${responseText.substring(0, 100)}`);
    }

    console.log(`[submitAIGame] Parsed result:`, result);

    if (!result.success) {
      console.error('[submitAIGame] Backend returned success: false', result);
      throw new Error(result.error || result.message || 'Backend returned an error');
    }

    if (!result.data) {
      console.warn('[submitAIGame] Backend returned success: true but no data field', result);
    }

    console.log(`[submitAIGame] Returning data:`, result.data);
    return result.data;
  } catch (error: any) {
    console.error('[submitAIGame] Error submitting AI game:', error);
    console.error('[submitAIGame] Error stack:', error?.stack);
    console.error('[submitAIGame] Error details:', {
      message: error?.message,
      name: error?.name,
      cause: error?.cause
    });
    throw error;
  }
}

/**
 * Get AI scores only (for preview without saving)
 */
export async function getAIScores(gameType: string, responseData: any) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_type: gameType,
        response_data: responseData
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('API Error:', errorData);
      throw new Error(errorData.error || `Failed to get AI scores: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Backend returned an error');
    }
    return result.data;
  } catch (error) {
    console.error('Error getting AI scores:', error);
    throw error;
  }
}

/**
 * Load active scoring configuration for a game
 */
export async function loadActiveGameConfig(gameType: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scoring/active/${gameType}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`Failed to load config: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Backend returned an error');
    }
    return result.data.config;
  } catch (error) {
    console.error('Error loading config:', error);
    throw error;
  }
}

/**
 * Get all scoring versions for a game
 */
export async function getAllScoringVersions(gameType: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scoring/versions/${gameType}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('API Error:', errorData);
      throw new Error(errorData.error || `Failed to load versions: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Backend returned an error');
    }
    return result.data;
  } catch (error) {
    console.error('Error loading versions:', error);
    throw error;
  }
}

/**
 * Set a specific version as active
 */
export async function setActiveVersion(gameType: string, versionName: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scoring/set-active`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_type: gameType,
        version_name: versionName
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('API Error:', errorData);
      throw new Error(errorData.error || `Failed to set active version: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Backend returned an error');
    }
    return result.data;
  } catch (error) {
    console.error('Error setting active version:', error);
    throw error;
  }
}

/**
 * Get results history for a game
 */
export async function getResultsHistory(gameType: string, userId?: string) {
  try {
    const url = userId 
      ? `${API_BASE_URL}/api/games/results/${gameType}?userId=${userId}`
      : `${API_BASE_URL}/api/games/results/${gameType}`;
    
    console.log(`[getResultsHistory] Fetching results from: ${url}`);
    console.log(`[getResultsHistory] Game type: ${gameType}, User ID: ${userId || 'none'}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    console.log(`[getResultsHistory] Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[getResultsHistory] Error response body:`, errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'Unknown error' };
      }
      
      console.error('[getResultsHistory] API Error:', errorData);
      throw new Error(errorData.error || errorData.message || `Failed to load results: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log(`[getResultsHistory] Response body:`, responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('[getResultsHistory] Failed to parse response as JSON:', e);
      throw new Error(`Invalid JSON response from server: ${responseText.substring(0, 100)}`);
    }

    console.log(`[getResultsHistory] Parsed result:`, result);

    if (!result.success) {
      console.error('[getResultsHistory] Backend returned success: false', result);
      throw new Error(result.error || result.message || 'Backend returned an error');
    }

    console.log(`[getResultsHistory] Returning data for ${gameType}:`, result.data);
    console.log(`[getResultsHistory] Number of sessions: ${Array.isArray(result.data) ? result.data.length : 'not an array'}`);
    
    return result.data || [];
  } catch (error: any) {
    console.error('[getResultsHistory] Error loading results:', error);
    console.error('[getResultsHistory] Error details:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      gameType,
      userId
    });
    throw error;
  }
}

/**
 * Get game content from database (scenarios, questions, topics)
 * Fetches from game_content table via /api/content/:game_type endpoint
 * Returns random content with content_id for tracking
 */
export async function getGameContent(gameType: string, difficulty?: string) {
  try {
    // Build URL with optional difficulty parameter
    let url = `${API_BASE_URL}/api/content/${gameType}`;
    if (difficulty) {
      url += `?difficulty=${difficulty}`;
    }

    console.log(`[getGameContent] Fetching content from: ${url}`);
    console.log(`[getGameContent] API_BASE_URL:`, API_BASE_URL);

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    console.log(`[getGameContent] Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[getGameContent] Error response body:`, errorText);
      console.error(`[getGameContent] API Error: Status ${response.status}`);
      throw new Error(`Failed to fetch game content: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log(`[getGameContent] Response body:`, responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('[getGameContent] Failed to parse response as JSON:', e);
      throw new Error(`Invalid JSON response from server: ${responseText.substring(0, 100)}`);
    }
    
    console.log(`[getGameContent] Parsed result:`, result);

    if (!result.success) {
      console.error('[getGameContent] Backend returned success: false', result);
      throw new Error(result.error || result.message || 'Backend returned an error');
    }

    console.log(`[getGameContent] Returning data:`, result.data);
    // Return the data with content_id
    return result.data;
  } catch (error: any) {
    console.error(`[getGameContent] Error fetching game content for ${gameType}:`, error);
    console.error(`[getGameContent] Error details:`, {
      message: error?.message,
      name: error?.name,
      stack: error?.stack
    });
    // Don't return fallback - throw error so games know backend fetch failed
    // Games should handle the error and show appropriate message to user
    throw error;
  }
}

/**
 * Save new scoring configuration
 */

export async function saveNewGameConfig(
  gameType: string,
  config: any,
  description?: string,
  userId?: string
) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scoring/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_type: gameType,
        config: config,
        description: description,
        user_id: userId
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`Failed to save config: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Backend returned an error');
    }
    return result.data;
  } catch (error) {
    console.error('Error saving config:', error);
    throw error;
  }
}
