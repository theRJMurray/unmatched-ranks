import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Match from '@/models/Match';

// GET /api/profiles/[username]/history - Get ELO history for charts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'lifetime';

    await connectDB();

    // Find user
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all completed matches for this user, sorted by date
    const matches = await Match.find({
      $or: [
        { player1Id: user._id },
        { player2Id: user._id }
      ],
      status: 'Completed'
    })
      .sort({ createdAt: 1 }); // Oldest first

    // Reconstruct ELO trajectory
    const history = [];
    let currentElo = type === 'lifetime' ? 1500 : 1200; // Starting ELO
    
    // Add starting point
    history.push({
      date: user.createdAt,
      elo: currentElo
    });

    // Process each match to build ELO history
    for (const match of matches) {
      const isPlayer1 = match.player1Id.toString() === user._id.toString();
      const isWinner = match.winner.toString() === user._id.toString();
      
      // Calculate ELO change for this match
      const startElo = type === 'lifetime' 
        ? (isPlayer1 ? match.eloLifetimeStartP1 : match.eloLifetimeStartP2)
        : (isPlayer1 ? match.eloSeasonalStartP1 : match.eloSeasonalStartP2);
      
      const opponentStartElo = type === 'lifetime'
        ? (isPlayer1 ? match.eloLifetimeStartP2 : match.eloLifetimeStartP1)
        : (isPlayer1 ? match.eloSeasonalStartP2 : match.eloSeasonalStartP1);

      // Calculate total ELO change for the match
      const totalGames = match.format === 'best-of-1' ? 1 : 3;
      const userGamesWon = isPlayer1 ? match.resolvedP1GamesWon : (totalGames - match.resolvedP1GamesWon);
      
      let eloChange = 0;
      for (let i = 0; i < userGamesWon; i++) {
        eloChange += 32 * (1 - (1 / (1 + Math.pow(10, (opponentStartElo - startElo) / 400))));
      }
      for (let i = 0; i < (totalGames - userGamesWon); i++) {
        eloChange += 32 * (0 - (1 / (1 + Math.pow(10, (opponentStartElo - startElo) / 400))));
      }

      currentElo += eloChange;

      history.push({
        date: match.createdAt,
        elo: Math.round(currentElo)
      });
    }

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Get ELO history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
