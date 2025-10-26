import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Challenge from '@/models/Challenge';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

// POST /api/challenges - Create a new challenge
export async function POST(request: NextRequest) {
  try {
    const currentUser = getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { challengedId } = await request.json();

    if (!challengedId) {
      return NextResponse.json(
        { error: 'Challenged user ID is required' },
        { status: 400 }
      );
    }

    if (challengedId === currentUser.userId) {
      return NextResponse.json(
        { error: 'Cannot challenge yourself' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify challenged user exists
    const challengedUser = await User.findById(challengedId);
    if (!challengedUser) {
      return NextResponse.json(
        { error: 'Challenged user not found' },
        { status: 404 }
      );
    }

    // Check if there's already a pending challenge between these users
    const existingChallenge = await Challenge.findOne({
      $or: [
        { challengerId: currentUser.userId, challengedId },
        { challengerId: challengedId, challengedId: currentUser.userId }
      ],
      status: 'Pending'
    });

    if (existingChallenge) {
      return NextResponse.json(
        { error: 'There is already a pending challenge between these users' },
        { status: 400 }
      );
    }

    // Create new challenge
    const challenge = new Challenge({
      challengerId: currentUser.userId,
      challengedId,
      status: 'Pending'
    });

    await challenge.save();

    return NextResponse.json({
      message: 'Challenge sent successfully',
      challenge: {
        id: challenge._id,
        challengerId: challenge.challengerId,
        challengedId: challenge.challengedId,
        status: challenge.status,
        createdAt: challenge.createdAt
      }
    });
  } catch (error) {
    console.error('Create challenge error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
