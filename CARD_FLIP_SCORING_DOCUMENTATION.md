# Card Flip Challenge - Scoring Documentation

## Overview

The Card Flip Challenge is designed to evaluate a user's **pattern recognition ability** across four different pattern types. Each game session uses one of four patterns that are rotated to ensure users experience different challenges. The game uses a **dynamic pattern system** where matching cards follow specific logical rules that users must discover.

## Game Structure

### Stage 1
- **Grid**: 4×5 (20 cards, 10 pairs)
- **Time Limit**: 60 seconds
- **Minimum Flips (Perfect Pattern Recognition)**: 20 flips (10 pairs × 2 flips)

### Stage 2
- **Grid**: 5×6 (30 cards, 15 pairs)
- **Time Limit**: 90 seconds
- **Minimum Flips (Perfect Pattern Recognition)**: 30 flips (15 pairs × 2 flips)

## Pattern Types

The game uses **four different patterns** that are rotated for each game session:

### 1. Mirror Pattern
**Type**: `mirror`

**Logic**: Card at position `i` matches card at position `N - 1 - i` (where N = total cards).

**Check Function**: `(pos1, pos2) => pos1 + pos2 === N - 1`

**Example for Stage 1 (20 cards):**
- Position 0 matches Position 19
- Position 1 matches Position 18
- Position 2 matches Position 17
- Position 9 matches Position 10

### 2. Sequential Pair Pattern
**Type**: `sequential`

**Logic**: Card at position `i` matches card at position `i + 1` (for all even `i`).

**Check Function**: `(pos1, pos2) => Math.abs(pos1 - pos2) === 1 && Math.min(pos1, pos2) % 2 === 0`

**Example for Stage 1 (20 cards):**
- Position 0 matches Position 1
- Position 2 matches Position 3
- Position 4 matches Position 5
- Position 18 matches Position 19

### 3. Split-Deck Pattern
**Type**: `split`

**Logic**: The first half of the deck matches the second half. Card at position `i` matches card at position `i + (N / 2)`.

**Check Function**: `(pos1, pos2) => Math.abs(pos1 - pos2) === N / 2`

**Example for Stage 1 (20 cards):**
- Position 0 matches Position 10
- Position 1 matches Position 11
- Position 2 matches Position 12
- Position 9 matches Position 19

### 4. Horizontal Mirror Pattern
**Type**: `horizontalMirror`

**Logic**: Cards in the same row mirror horizontally. For a card at `(row, col)`, it matches the card at `(row, COLS-1-col)`. Column 0 matches column (COLS-1), column 1 matches column (COLS-2), etc.

**Check Function**: 
```javascript
(pos1, pos2) => {
  const row1 = Math.floor(pos1 / COLS);
  const row2 = Math.floor(pos2 / COLS);
  const col1 = pos1 % COLS;
  const col2 = pos2 % COLS;
  return row1 === row2 && // Must be in the same row
         col1 + col2 === COLS - 1; // Columns mirror horizontally
}
```

**Example for Stage 1 (4×5 grid):**
- Row 0: Position 0 matches Position 4, Position 1 matches Position 3
- Row 1: Position 5 matches Position 9, Position 6 matches Position 8
- Row 2: Position 10 matches Position 14, Position 11 matches Position 13
- Row 3: Position 15 matches Position 19, Position 16 matches Position 18

## Pattern Rotation System

The game uses a **rotation system** to ensure users experience all four patterns before repeating:

1. **Master Queue**: `['mirror', 'sequential', 'split', 'horizontalMirror']`
2. **Storage**: Uses `localStorage` with key `'cardFlipPlayedPatterns'` to track played patterns
3. **Rotation Logic**:
   - On game start, the system finds the next unplayed pattern from the master queue
   - If all patterns have been played, the queue resets and starts from the beginning
   - The current pattern type is stored for the session and used for scoring

**Benefits**:
- Ensures variety across game sessions
- Prevents users from getting the same pattern repeatedly
- Maintains fairness by cycling through all patterns

## Scoring Components

**Note**: All scoring is now handled by the backend. The frontend only tracks moves and pattern matches for data collection. The backend calculates all scores using its configured formulae.

The final score is calculated using **four fixed competencies** with the following weights (as configured in the backend):

### 1. Pattern Recognition (40% weight) - **PRIMARY METRIC**

This is the most important metric as it directly evaluates whether the user identified the current pattern type.

**Calculation Process**:

1. **Pattern Match Detection**: For each correct match, the system uses the appropriate checker function for the current pattern type to determine if the match follows the pattern.

2. **Pattern Match Rate**: 
   ```
   Pattern Match Rate = (Pattern Matches / Total Correct Matches) × 100
   ```

3. **Pattern Recognition Score**:
   - **Base Score**: Pattern Match Rate
   - **Early Discovery Bonus**: If pattern is discovered in the first half of moves, add up to 20 points based on how early it was discovered
     - Formula: `(1 - (discoveryMove / totalMoves)) × 20`
   - **Random Match Penalty**: If random matches exceed pattern matches by 2×, apply 50% penalty to the base score
   - **Partial Credit**: If user got perfect accuracy but didn't follow pattern (patternMatchRate < 30%), give minimum 30% score

4. **Pattern Discovery Detection**:
   - Uses a sliding window of recent moves (5 moves or half of total moves, whichever is smaller)
   - If 80%+ of recent correct matches follow the pattern, the pattern is considered "discovered"
   - Records the move number when discovery occurred

**Scoring Scale**:
- **90-100**: Excellent pattern recognition - discovered pattern early and consistently used it
- **70-89**: Good pattern recognition - discovered pattern and mostly used it
- **50-69**: Moderate pattern recognition - some pattern recognition but inconsistent
- **30-49**: Weak pattern recognition - minimal pattern recognition, mostly random
- **0-29**: No pattern recognition - purely random matching

### 2. Accuracy (25% weight)

Measures how many pairs were correctly matched.

**Calculation**:
```
Accuracy = (Pairs Matched / Total Pairs) × 100
```

**Weighted Average**:
- Stage 1 accuracy: 40% weight
- Stage 2 accuracy: 60% weight (more important as it's harder)

**Scoring Scale**:
- **90-100**: Excellent accuracy
- **70-89**: Good accuracy
- **50-69**: Moderate accuracy
- **30-49**: Weak accuracy
- **0-29**: Poor accuracy

### 3. Speed (20% weight)

Measures how quickly the user completed the game relative to the time limit.

**Calculation**:
```
Speed = (1 - (Time Taken / Time Limit)) × 100 × 1.2
```

If time taken exceeds time limit, speed = 0.

**Bonus**: +10 points if completed in under 50% of time limit

**Weighted Average**:
- Stage 1 speed: 40% weight
- Stage 2 speed: 60% weight

**Scoring Scale**:
- **90-100**: Excellent speed - completed well before time limit
- **70-89**: Good speed - completed with time to spare
- **50-69**: Moderate speed - completed within time limit
- **30-49**: Slow - used most of the time limit
- **0-29**: Very slow - exceeded time limit or used almost all time

### 4. Strategy/Efficiency (15% weight)

Measures how efficiently the user matched pairs (minimal flips).

**Calculation**:
```
Efficiency = (Minimum Flips Possible / Actual Flips) × 100
```

Capped at 100 (can't exceed perfect efficiency).

**Bonus**: +15 points if user got perfect accuracy but efficiency was below 80%

**Weighted Average**:
- Stage 1 efficiency: 40% weight
- Stage 2 efficiency: 60% weight

**Scoring Scale**:
- **90-100**: Excellent efficiency - near-optimal flips
- **70-89**: Good efficiency - efficient matching
- **50-69**: Moderate efficiency - average number of flips
- **30-49**: Inefficient - many unnecessary flips
- **0-29**: Very inefficient - excessive flips

## Final Score Calculation

The final score uses **fixed weights** for all pattern types:

```
Final Score = (
  Pattern Recognition × 0.40 +
  Accuracy × 0.25 +
  Speed × 0.20 +
  Efficiency × 0.15
)
```

**Note**: The final score is capped at 100.

## Dynamic Pattern Recognition Scoring

The key innovation is that **Pattern Recognition is calculated dynamically** based on the current pattern type:

1. **Pattern Type Detection**: The system knows which pattern type was used for the current session (e.g., `'split'`)

2. **Pattern Checker Selection**: The appropriate checker function is selected based on the pattern type:
   ```javascript
   const patternChecker = getPatternChecker(patternType);
   // Returns the correct function: mirror, sequential, split, or horizontalMirror
   ```

3. **Match Evaluation**: Each correct match is evaluated against the pattern checker:
   ```javascript
   const isPatternMatch = patternChecker(pos1, pos2, totalCards, cols);
   ```

4. **Score Calculation**: The pattern recognition score is calculated based on:
   - Percentage of matches that followed the pattern
   - Early discovery bonus
   - Random match penalty

This ensures that **all four competencies are always measured**, regardless of which pattern type is used, with Pattern Recognition correctly identified as the primary cognitive skill.

## Pattern Recognition Detection Algorithm

### Step 1: Move Recording
Each move is recorded with:
- Card positions flipped
- Whether it was a correct match
- Whether it followed the current pattern (using pattern-specific checker)
- Time since game start

### Step 2: Pattern Discovery Detection
1. Use a sliding window of recent moves (5 moves or half of total moves)
2. Calculate pattern match rate in the window using the current pattern's checker
3. If 80%+ of correct matches in the window follow the pattern, pattern is considered "discovered"
4. Record the move number when discovery occurred

### Step 3: Pattern Recognition Score
1. Calculate overall pattern match rate using the pattern-specific checker
2. Apply early discovery bonus if pattern was discovered early
3. Apply penalty if random matches significantly exceed pattern matches
4. Normalize to 0-100 scale

## Example Scenarios

### Scenario 1: Perfect Pattern Recognition (Mirror Pattern)
- **Pattern Type**: `mirror`
- **Pattern Matches**: 25 (all matches follow mirror pattern: pos1 + pos2 === N-1)
- **Random Matches**: 0
- **Discovery Move**: 3 (discovered very early)
- **Pattern Match Rate**: 100%
- **Pattern Recognition Score**: 100 (base 100 + early discovery bonus)

### Scenario 2: Good Pattern Recognition (Split Pattern)
- **Pattern Type**: `split`
- **Pattern Matches**: 20
- **Random Matches**: 5
- **Discovery Move**: 8 (discovered in first third)
- **Pattern Match Rate**: 80%
- **Pattern Recognition Score**: ~90 (base 80 + early discovery bonus)

### Scenario 3: Random Picking (Any Pattern)
- **Pattern Type**: `horizontalMirror`
- **Pattern Matches**: 5
- **Random Matches**: 20
- **Discovery Move**: null (never discovered)
- **Pattern Match Rate**: 20%
- **Pattern Recognition Score**: 10 (base 20 × 0.5 penalty for excessive random matches)

### Scenario 4: Partial Pattern Recognition (Sequential Pattern)
- **Pattern Type**: `sequential`
- **Pattern Matches**: 15
- **Random Matches**: 10
- **Discovery Move**: 15 (discovered late)
- **Pattern Match Rate**: 60%
- **Pattern Recognition Score**: ~55 (base 60, no early discovery bonus, slight penalty)

## Data Submitted to Backend

The game submits the following data structure (preserving database compatibility):

```javascript
{
  stage1: {
    pairs_matched: number,
    total_pairs: number,
    total_flips: number,
    min_flips_possible: number,
    time_taken: number,
    time_limit: number,
    pattern_type: string  // 'mirror', 'sequential', 'split', or 'horizontalMirror'
  },
  stage2: {
    // Same structure as stage1
  },
  totals: {
    total_pairs_matched: number,
    total_pairs_possible: number,
    total_flips: number,
    total_min_flips: number,
    total_time_taken: number,
    total_time_limit: number,
    pattern_type: string
  },
  pattern_recognition: {
    // Detailed pattern recognition stats
    pattern_discovered: boolean,
    pattern_recognition_score: number,
    pattern_type: string
  }
}
```

## Frontend vs Backend Scoring

### Frontend Scoring (Primary)
- The frontend calculates all scores using the algorithms described above
- Scores are calculated immediately after game completion
- Uses the current pattern type to dynamically evaluate pattern recognition
- If backend submission fails, frontend scores are used

### Backend Scoring (Fallback)
- The game attempts to submit data to the backend
- Backend receives `pattern_type` in the raw data for reference
- If backend returns scores, those are used
- If backend fails or doesn't return scores, frontend scores are used
- Backend can override frontend scores if configured

## Competencies Evaluated

1. **Pattern Recognition** (40%): Ability to identify and utilize the current pattern type
2. **Accuracy** (25%): Ability to correctly match pairs
3. **Speed** (20%): Ability to complete the game quickly
4. **Strategy/Efficiency** (15%): Ability to minimize unnecessary flips

## Key Insights

### What High Pattern Recognition Score Indicates:
- User identified the current pattern type
- User consistently used the pattern to find matches
- User discovered the pattern early in the game
- User's strategy was systematic rather than random

### What Low Pattern Recognition Score Indicates:
- User did not identify the pattern
- User matched pairs randomly
- User relied on memory alone without pattern recognition
- User's strategy was inefficient

### What the Game Tests:
1. **Cognitive Pattern Recognition**: Can the user identify hidden patterns across different pattern types?
2. **Logical Reasoning**: Can the user apply the pattern once discovered?
3. **Memory**: Can the user remember card positions?
4. **Strategic Thinking**: Can the user optimize their approach?
5. **Adaptability**: Can the user adapt to different pattern types across sessions?

## Pattern Rotation Benefits

1. **Variety**: Users experience different challenges each session
2. **Fairness**: All users cycle through the same patterns
3. **Comprehensive Assessment**: Tests pattern recognition ability across multiple pattern types
4. **Prevents Memorization**: Users can't memorize one pattern and reuse it

## Notes

- The pattern is **not disclosed** to users in instructions
- Users must discover the pattern through gameplay
- The scoring system distinguishes between pattern-based and random matching
- Early pattern discovery is rewarded with bonus points
- Excessive random matching is penalized
- The pattern type changes each session through rotation
- All patterns are scored using the same fixed weights for consistency

## Future Enhancements

Potential improvements to the scoring system:
1. Add more sophisticated pattern recognition algorithms
2. Analyze move sequences for pattern-seeking behavior
3. Track time between pattern discovery and pattern utilization
4. Add difficulty levels with different patterns
5. Implement machine learning to better detect pattern recognition
6. Add pattern-specific analytics (e.g., which patterns are easier/harder to discover)
