import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Match from '@/models/Match';
import Challenge from '@/models/Challenge';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(
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

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user's matches
    await Match.deleteMany({
      $or: [
        { player1Id: user._id },
        { player2Id: user._id }
      ]
    });

    // Delete user's challenges
    await Challenge.deleteMany({
      $or: [
        { challengerId: user._id },
        { challengedId: user._id }
      ]
    });

    // Delete the user
    await User.findByIdAndDelete(id);

    return NextResponse.json({ 
      message: 'User deleted successfully',
      deletedUser: {
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
