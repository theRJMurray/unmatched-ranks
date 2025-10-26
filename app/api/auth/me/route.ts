import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const currentUser = getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('JWT Token role:', currentUser.role);
    console.log('JWT Token userId:', currentUser.userId);

    await connectDB();
    
    const user = await User.findById(currentUser.userId).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('Database user role:', user.role);
    console.log('Database user username:', user.username);

    return NextResponse.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        eloLifetime: Math.round(user.eloLifetime),
        eloSeasonal: Math.round(user.eloSeasonal),
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
