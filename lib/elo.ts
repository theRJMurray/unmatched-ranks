/**
 * ELO Rating System Utility Functions
 * 
 * K-factor = 32 for all calculations
 * Formula: expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
 * Delta: deltaA = K * (scoreA - expectedA)
 */

const K_FACTOR = 32;

/**
 * Calculate the expected score for player A against player B
 * @param ratingA - Player A's current rating
 * @param ratingB - Player B's current rating
 * @returns Expected score for player A (0-1)
 */
export function calculateExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculate ELO rating change for a single game
 * @param playerRating - The player's current rating
 * @param opponentRating - The opponent's current rating
 * @param actualScore - 1 for win, 0 for loss
 * @returns Rating change (positive for win, negative for loss)
 */
export function calculateEloChange(
  playerRating: number, 
  opponentRating: number, 
  actualScore: number
): number {
  const expectedScore = calculateExpectedScore(playerRating, opponentRating);
  return K_FACTOR * (actualScore - expectedScore);
}

/**
 * Calculate ELO changes for a complete match
 * @param player1Rating - Player 1's rating at match start
 * @param player2Rating - Player 2's rating at match start
 * @param player1GamesWon - Number of games player 1 won
 * @param totalGames - Total games in the match (1 for bo1, 3 for bo3)
 * @returns Object with rating changes for both players
 */
export function calculateMatchEloChanges(
  player1Rating: number,
  player2Rating: number,
  player1GamesWon: number,
  totalGames: number
): { player1Change: number; player2Change: number } {
  let player1Change = 0;
  
  // Calculate change for each game player 1 won
  for (let i = 0; i < player1GamesWon; i++) {
    player1Change += calculateEloChange(player1Rating, player2Rating, 1);
  }
  
  // Calculate change for each game player 1 lost
  const player1GamesLost = totalGames - player1GamesWon;
  for (let i = 0; i < player1GamesLost; i++) {
    player1Change += calculateEloChange(player1Rating, player2Rating, 0);
  }
  
  // Player 2's change is the negative of player 1's change (zero-sum)
  const player2Change = -player1Change;
  
  return { player1Change, player2Change };
}

/**
 * Get total games for a match format
 * @param format - Match format ('best-of-1' or 'best-of-3')
 * @returns Total number of games
 */
export function getTotalGames(format: 'best-of-1' | 'best-of-3'): number {
  return format === 'best-of-1' ? 1 : 3;
}

/**
 * Validate if a games won count is valid for a format
 * @param gamesWon - Number of games won
 * @param format - Match format
 * @returns True if valid
 */
export function isValidGamesWon(gamesWon: number, format: 'best-of-1' | 'best-of-3'): boolean {
  const totalGames = getTotalGames(format);
  return gamesWon >= 0 && gamesWon <= totalGames;
}

/**
 * Determine the winner based on games won and format
 * @param player1GamesWon - Games won by player 1
 * @param format - Match format
 * @returns Winner ID (1 for player 1, 2 for player 2, null for invalid)
 */
export function determineWinner(
  player1GamesWon: number, 
  format: 'best-of-1' | 'best-of-3'
): 1 | 2 | null {
  const totalGames = getTotalGames(format);
  const requiredWins = Math.ceil(totalGames / 2);
  
  if (player1GamesWon >= requiredWins) {
    return 1;
  } else if ((totalGames - player1GamesWon) >= requiredWins) {
    return 2;
  }
  
  return null; // Invalid result
}
