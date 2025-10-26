import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Challenge from '@/models/Challenge';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

// GET /api/challenges - Get challenges for current user
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

    // Get challenges where user is either challenger or challenged
    const challenges = await Challenge.find({
      $or: [
        { challengerId: currentUser.userId },
        { challengedId: currentUser.userId }
      ]
    })
      .populate('challengerId', 'username')
      .populate('challengedId', 'username')
      .sort({ createdAt: -1 });

    return NextResponse.json({ challenges });
  } catch (error) {
    console.error('Get challenges error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const { challengedId, proposedFormat, challengerDeck } = await request.json();

    if (!challengedId || !proposedFormat || !challengerDeck) {
      return NextResponse.json(
        { error: 'Challenged user ID, format, and deck are required' },
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
      proposedFormat,
      challengerDeck,
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
