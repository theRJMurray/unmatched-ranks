import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Challenge from '@/models/Challenge';
import Match from '@/models/Match';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

// PATCH /api/challenges/[id] - Update challenge (accept/decline)
export async function PATCH(
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

    const { id } = await params;
    const { action, challengedDeck } = await request.json();

    await connectDB();

    // Find the challenge
    const challenge = await Challenge.findById(id)
      .populate('challengerId', 'username eloLifetime eloSeasonal')
      .populate('challengedId', 'username eloLifetime eloSeasonal');

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Verify the current user is the challenged user
    if (challenge.challengedId._id.toString() !== currentUser.userId) {
      return NextResponse.json(
        { error: 'Not authorized to modify this challenge' },
        { status: 403 }
      );
    }

    if (challenge.status !== 'Pending') {
      return NextResponse.json(
        { error: 'Challenge is no longer pending' },
        { status: 400 }
      );
    }

    if (action === 'decline') {
      challenge.status = 'Declined';
      await challenge.save();

      return NextResponse.json({
        message: 'Challenge declined',
        challenge: challenge
      });
    }

    if (action === 'accept') {
      if (!challengedDeck) {
        return NextResponse.json(
          { error: 'Deck selection is required to accept challenge' },
          { status: 400 }
        );
      }

      challenge.challengedDeck = challengedDeck;
      challenge.status = 'Locked';
      await challenge.save();

      // Create match from challenge
      const player1Id = challenge.challengerId._id < challenge.challengedId._id 
        ? challenge.challengerId._id 
        : challenge.challengedId._id;
      const player2Id = challenge.challengerId._id < challenge.challengedId._id 
        ? challenge.challengedId._id 
        : challenge.challengerId._id;

      const deck1 = challenge.challengerId._id < challenge.challengedId._id 
        ? challenge.challengerDeck 
        : challenge.challengedDeck;
      const deck2 = challenge.challengerId._id < challenge.challengedId._id 
        ? challenge.challengedDeck 
        : challenge.challengerDeck;

      const format = challenge.proposedFormat === 'bo1' ? 'best-of-1' : 'best-of-3';

      // Get current ELO ratings
      const player1 = await User.findById(player1Id);
      const player2 = await User.findById(player2Id);

      const match = new Match({
        player1Id,
        player2Id,
        deck1,
        deck2,
        format,
        eloLifetimeStartP1: player1.eloLifetime,
        eloLifetimeStartP2: player2.eloLifetime,
        eloSeasonalStartP1: player1.eloSeasonal,
        eloSeasonalStartP2: player2.eloSeasonal,
        status: 'Pending'
      });

      await match.save();

      // Delete the challenge
      await Challenge.findByIdAndDelete(id);

      return NextResponse.json({
        message: 'Challenge accepted and match created',
        match: {
          id: match._id,
          player1: player1.username,
          player2: player2.username,
          deck1,
          deck2,
          format
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Update challenge error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
