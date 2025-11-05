import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eaoxsylwvnabufdpenlc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhb3hzeWx3dm5hYnVmZHBlbmxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNzYwODMsImV4cCI6MjA3Nzc1MjA4M30.W6ec2ZM4F5TSq3WtxkIA1mJY8ylyYF2iC0dFwZIE_Cs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Save game result to the database
 * @param gameId - Unique identifier for the game (e.g., 'mental-math-easy')
 * @param scoreData - Complete score data object to be saved
 */
export async function saveGameResult(gameId: string, scoreData: any) {
  try {
    const { data, error } = await supabase
      .from('game_results')
      .insert({
        game_id: gameId,
        score_data: scoreData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving game result:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to save game result:', error);
    throw error;
  }
}

/**
 * Fetch all game results for a specific game
 * @param gameId - Game identifier to filter results
 */
export async function getGameResults(gameId?: string) {
  try {
    let query = supabase
      .from('game_results')
      .select('*')
      .order('created_at', { ascending: false });

    if (gameId) {
      query = query.eq('game_id', gameId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching game results:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch game results:', error);
    throw error;
  }
}
