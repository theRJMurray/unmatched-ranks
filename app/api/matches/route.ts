import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Match from '@/models/Match';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

// GET /api/matches - List matches with populated user data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    await connectDB();

    let query = {};
    let currentUser = null;

    if (userId === 'me') {
      currentUser = getCurrentUser(request);
      if (!currentUser) {
        return NextResponse.json(
          { error: 'Not authenticated' },
          { status: 401 }
        );
      }
      query = {
        $or: [
          { player1Id: currentUser.userId },
          { player2Id: currentUser.userId }
        ]
      };
    } else {
      // For admin dashboard - no filtering
      currentUser = getCurrentUser(request);
      if (!currentUser || currentUser.role !== 'admin') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }
    
    const matches = await Match.find(query)
      .populate('player1Id', 'username')
      .populate('player2Id', 'username')
      .populate('winner', 'username')
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ matches });
  } catch (error) {
    console.error('Get matches error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/matches - Create a new match
export async function POST(request: NextRequest) {
  try {
    const currentUser = getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Only admins can create matches
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { player1Id, player2Id, deck1, deck2, format } = await request.json();

    // Validation
    if (!player1Id || !player2Id || !deck1 || !deck2 || !format) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (player1Id === player2Id) {
      return NextResponse.json(
        { error: 'Players cannot be the same' },
        { status: 400 }
      );
    }

    if (!['best-of-1', 'best-of-3'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify both players exist and get their current ELO ratings
    const players = await User.find({ _id: { $in: [player1Id, player2Id] } });
    if (players.length !== 2) {
      return NextResponse.json(
        { error: 'One or both players not found' },
        { status: 400 }
      );
    }

    // Find player1 and player2 (ensure player1 has lower ID for consistency)
    const player1 = players.find(p => p._id.toString() === player1Id);
    const player2 = players.find(p => p._id.toString() === player2Id);
    
    if (!player1 || !player2) {
      return NextResponse.json(
        { error: 'Player lookup failed' },
        { status: 400 }
      );
    }

    // Create new match with initial ELO ratings
    const match = new Match({
      player1Id,
      player2Id,
      deck1,
      deck2,
      format,
      status: 'Pending',
      eloLifetimeStartP1: player1.eloLifetime,
      eloLifetimeStartP2: player2.eloLifetime,
      eloSeasonalStartP1: player1.eloSeasonal,
      eloSeasonalStartP2: player2.eloSeasonal
    });

    await match.save();

    // Populate the response
    const populatedMatch = await Match.findById(match._id)
      .populate('player1Id', 'username')
      .populate('player2Id', 'username');

    return NextResponse.json({
      message: 'Match created successfully',
      match: populatedMatch
    });
  } catch (error) {
    console.error('Create match error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
