import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

// PATCH /api/users/[id] - Update user role
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

    // Only admins can update user roles
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { role } = await request.json();
    const { id } = await params;

    if (!role || !['user', 'organizer', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Don't allow changing your own role
    if (user._id.toString() === currentUser.userId) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      );
    }

    // Store old role for audit
    const oldRole = user.role;

    // Update user role and audit info
    user.role = role;
    user.roleAudit = {
      changedBy: currentUser.userId,
      changedAt: new Date(),
      oldRole: oldRole
    };

    await user.save();

    return NextResponse.json({
      message: 'User role updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        eloLifetime: user.eloLifetime,
        eloSeasonal: user.eloSeasonal
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
