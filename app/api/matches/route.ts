import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Match from '@/models/Match';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

// GET /api/matches - List matches with populated user data
export async function GET(request: NextRequest) {
  try {
    const currentUser = getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const matches = await Match.find()
      .populate('player1Id', 'username')
      .populate('player2Id', 'username')
      .populate('winner', 'username')
      .sort({ createdAt: -1 })
      .limit(20);

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

    // Verify both players exist
    const players = await User.find({ _id: { $in: [player1Id, player2Id] } });
    if (players.length !== 2) {
      return NextResponse.json(
        { error: 'One or both players not found' },
        { status: 400 }
      );
    }

    // Create new match
    const match = new Match({
      player1Id,
      player2Id,
      deck1,
      deck2,
      format,
      status: 'Pending'
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
