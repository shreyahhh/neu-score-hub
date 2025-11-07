import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cxpjzajiefoviervmxxb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4cGp6YWppZWZvdmllcnZteHhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzMzMzMTcsImV4cCI6MjA3NzkwOTMxN30.qAJmo2Ev5dh4B2g1n34sZOQ7g8ASKab-lqatF3dJQfc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Game type mapping
export type GameType = 
  | 'mental_math_sprint'
  | 'face_name_match'
  | 'sign_sudoku'
  | 'stroop_test'
  | 'card_flip_challenge'
  | 'scenario_challenge'
  | 'ai_debate'
  | 'creative_uses'
  | 'statement_reasoning'
  | 'vocab_challenge'
  | 'lucky_flip';

/**
 * Get the active scoring configuration for a game
 */
export async function getActiveScoringVersion(gameType: GameType) {
  try {
    const { data, error } = await supabase
      .from('scoring_versions')
      .select('*')
      .eq('game_type', gameType)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error loading active scoring version:', error);
    throw error;
  }
}

/**
 * Save a new scoring version and set it as active
 */
export async function saveNewScoringVersion(gameType: GameType, config: any, description?: string) {
  try {
    // Get next version name
    const { data: nextVersion } = await supabase
      .rpc('get_next_version_name', { p_game_type: gameType });

    // Deactivate old version
    await supabase
      .from('scoring_versions')
      .update({ is_active: false })
      .eq('game_type', gameType)
      .eq('is_active', true);

    // Insert new version
    const { data, error } = await supabase
      .from('scoring_versions')
      .insert({
        game_type: gameType,
        version_name: nextVersion,
        is_active: true,
        config,
        description
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving new version:', error);
    throw error;
  }
}

/**
 * Submit game result and calculate scores
 */
export async function submitGameResult(
  gameType: GameType,
  rawData: any,
  finalScores: any,
  userId?: string
) {
  try {
    // Get active version
    const version = await getActiveScoringVersion(gameType);

    // Create test session
    const { data: session, error: sessionError } = await supabase
      .from('test_sessions')
      .insert({
        user_id: userId || null,
        game_type: gameType,
        scoring_version_id: version.id,
        status: 'completed',
        final_scores: finalScores,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Save raw data based on game type
    const isTextGame = ['scenario_challenge', 'ai_debate', 'creative_uses', 'statement_reasoning'].includes(gameType);
    
    if (isTextGame) {
      await supabase
        .from('text_receipts')
        .insert({
          session_id: session.id,
          response_data: rawData
        });
    } else {
      await supabase
        .from('action_receipts')
        .insert({
          session_id: session.id,
          raw_data: rawData
        });
    }

    return session;
  } catch (error) {
    console.error('Error submitting game result:', error);
    throw error;
  }
}

/**
 * Get all game results for comparison
 */
export async function getGameResultsHistory(gameType: GameType, userId?: string) {
  try {
    let query = supabase
      .from('test_sessions')
      .select(`
        id,
        final_scores,
        created_at,
        completed_at,
        scoring_versions(version_name)
      `)
      .eq('game_type', gameType)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching game results:', error);
    throw error;
  }
}

/**
 * Get all versions for a game
 */
export async function getAllVersions(gameType: GameType) {
  try {
    const { data, error } = await supabase
      .from('scoring_versions')
      .select('*')
      .eq('game_type', gameType)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching versions:', error);
    throw error;
  }
}

/**
 * Set a specific version as active
 */
export async function setActiveVersion(gameType: GameType, versionName: string) {
  try {
    // Deactivate all versions for this game
    await supabase
      .from('scoring_versions')
      .update({ is_active: false })
      .eq('game_type', gameType);

    // Activate the selected version
    const { data, error } = await supabase
      .from('scoring_versions')
      .update({ is_active: true })
      .eq('game_type', gameType)
      .eq('version_name', versionName)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error setting active version:', error);
    throw error;
  }
}
