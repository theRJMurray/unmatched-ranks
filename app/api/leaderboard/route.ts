import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// GET /api/leaderboard - Get leaderboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'lifetime';
    const season = parseInt(searchParams.get('season') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    await connectDB();

    // Build sort field based on type
    const sortField = type === 'lifetime' ? 'eloLifetime' : 'eloSeasonal';

    // Get users sorted by ELO
    const users = await User.find()
      .select('-password -email -roleAudit')
      .sort({ [sortField]: -1 })
      .limit(limit);

    // Format leaderboard data
    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      id: user._id,
      username: user.username,
      elo: Math.round(type === 'lifetime' ? user.eloLifetime : user.eloSeasonal),
      matchesPlayed: user.matchesPlayed,
      wins: user.wins,
      winRate: user.matchesPlayed > 0 ? (user.wins / user.matchesPlayed * 100).toFixed(1) : '0.0',
      role: user.role
    }));

    return NextResponse.json({
      leaderboard,
      type,
      season,
      total: users.length
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
