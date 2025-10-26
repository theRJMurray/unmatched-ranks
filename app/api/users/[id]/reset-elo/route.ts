import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = getCurrentUser(request);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    await connectDB();

    // Find the user to reset
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Reset ELO to default values
    user.eloLifetime = 1500;
    user.eloSeasonal = 1200;
    user.matchesPlayed = 0;
    user.wins = 0;
    await user.save();

    return NextResponse.json({ 
      message: 'ELO reset successfully',
      user: {
        username: user.username,
        eloLifetime: user.eloLifetime,
        eloSeasonal: user.eloSeasonal
      }
    });

  } catch (error) {
    console.error('Reset ELO error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
