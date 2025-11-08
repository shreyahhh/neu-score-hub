// Central API Client for NeuRazor Backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Default test user ID (from backend documentation)
const DEFAULT_USER_ID = '53f77b43-d71a-4edf-8b80-c70b975264d8';

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
 */
export async function submitAIGame(gameType: string, responseData: any, userId?: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/submit-game`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_type: gameType,
        response_data: responseData,
        user_id: userId || DEFAULT_USER_ID
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('API Error:', errorData);
      throw new Error(errorData.error || `Failed to submit AI game: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Backend returned an error');
    }
    return result.data;
  } catch (error) {
    console.error('Error submitting AI game:', error);
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
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('API Error:', errorData);
      throw new Error(errorData.error || `Failed to load results: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Backend returned an error');
    }
    return result.data;
  } catch (error) {
    console.error('Error loading results:', error);
    throw error;
  }
}

export async function getGameContent(gameType: string) {
  console.warn(`Backend endpoint /api/games/content/${gameType} is not documented. Returning mock data.`);
  // NOTE: This is mock data. A backend endpoint should exist to provide game content.
  if (gameType === 'scenario_challenge') {
    return {
      id: 'scenario-1',
      title: 'Office Conflict',
      description: 'You overhear a disagreement between two colleagues, Alex and Ben, about a project deadline. Alex is visibly stressed, while Ben seems dismissive.',
      questions: [
        { id: 1, text: 'What are the potential underlying reasons for Alexs and Bens behavior?' },
        { id: 2, text: 'How would you approach Alex to understand their perspective?' },
        { id: 3, text: 'How would you approach Ben to mediate the situation?' },
        { id: 4, text: 'What steps would you take to resolve the conflict and ensure the project stays on track?' },
      ],
    };
  } else if (gameType === 'creative_uses') {
    return {
      object_name: 'Brick',
    };
  } else if (gameType === 'interview') {
    return [
      { id: 1, text: 'Tell me about a time you failed and what you learned from it.', competency: 'Resilience' },
      { id: 2, text: 'Describe a situation where you had to motivate a team. What was the outcome?', competency: 'Leadership' },
      { id: 3, text: 'How do you handle constructive criticism?', competency: 'Growth Mindset' },
      { id: 4, text: 'Walk me through a complex problem you solved. What was your process?', competency: 'Problem-Solving' },
    ];
  }
  throw new Error(`Mock data for gameType: ${gameType} not found.`);
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
