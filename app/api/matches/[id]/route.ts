import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Match from '@/models/Match';
import { getCurrentUser } from '@/lib/auth';

// PUT /api/matches/[id] - Update match (winner, status)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Only admins can update matches
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { winner, status } = await request.json();
    const { id } = await params;

    await connectDB();

    const match = await Match.findById(id);
    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Update match
    if (winner !== undefined) match.winner = winner;
    if (status !== undefined) match.status = status;

    await match.save();

    // Populate the response
    const populatedMatch = await Match.findById(match._id)
      .populate('player1Id', 'username')
      .populate('player2Id', 'username')
      .populate('winner', 'username');

    return NextResponse.json({
      message: 'Match updated successfully',
      match: populatedMatch
    });
  } catch (error) {
    console.error('Update match error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
