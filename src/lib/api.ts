// Central API Client for NeuRazor Backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

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
        user_id: userId
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`Failed to submit game: ${response.status}`);
    }

    const result = await response.json();
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
        user_id: userId
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`Failed to submit AI game: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error submitting AI game:', error);
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
    return result.data.config;
  } catch (error) {
    console.error('Error loading config:', error);
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
    return result.data;
  } catch (error) {
    console.error('Error saving config:', error);
    throw error;
  }
}
