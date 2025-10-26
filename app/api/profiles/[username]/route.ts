import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Match from '@/models/Match';

// GET /api/profiles/[username] - Get public user profile data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const eloType = searchParams.get('type') || 'lifetime';

    await connectDB();

    // Find user by normalized username
    const user = await User.findOne({ username: username.toLowerCase() })
      .select('-password -email -roleAudit');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get recent matches for this user
    const recentMatches = await Match.find({
      $or: [
        { player1Id: user._id },
        { player2Id: user._id }
      ],
      status: 'Completed'
    })
      .populate('player1Id', 'username')
      .populate('player2Id', 'username')
      .populate('winner', 'username')
      .sort({ createdAt: -1 })
      .limit(10);

    // Calculate win rate
    const totalMatches = user.matchesPlayed;
    const winRate = totalMatches > 0 ? (user.wins / totalMatches * 100).toFixed(1) : '0.0';

    // Format recent matches
    const formattedMatches = recentMatches.map(match => {
      const isPlayer1 = match.player1Id._id.toString() === user._id.toString();
      const opponent = isPlayer1 ? match.player2Id : match.player1Id;
      const userDeck = isPlayer1 ? match.deck1 : match.deck2;
      const opponentDeck = isPlayer1 ? match.deck2 : match.deck1;
      const isWinner = match.winner._id.toString() === user._id.toString();
      
      // Calculate ELO change (simplified - would need more complex logic for accurate change)
      const eloChange = isWinner ? '+16' : '-16'; // Placeholder

      return {
        id: match._id,
        opponent: opponent.username,
        userDeck,
        opponentDeck,
        format: match.format,
        result: isWinner ? 'W' : 'L',
        eloChange,
        date: match.createdAt
      };
    });

    return NextResponse.json({
      user: {
        id: user._id,
        username: user.username,
        eloLifetime: Math.round(user.eloLifetime),
        eloSeasonal: Math.round(user.eloSeasonal),
        matchesPlayed: user.matchesPlayed,
        wins: user.wins,
        winRate,
        role: user.role,
        createdAt: user.createdAt
      },
      recentMatches: formattedMatches
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
