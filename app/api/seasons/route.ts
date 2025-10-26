import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Season from '@/models/Season';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

// GET /api/seasons - Get all seasons
export async function GET() {
  try {
    await connectDB();
    
    const seasons = await Season.find()
      .sort({ seasonNum: -1 });

    return NextResponse.json({ seasons });
  } catch (error) {
    console.error('Get seasons error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/seasons - Start a new season (admin only)
export async function POST(request: NextRequest) {
  try {
    const currentUser = getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Only admins can start new seasons
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    // End current active season
    await Season.updateOne(
      { isActive: true },
      { 
        isActive: false,
        endDate: new Date()
      }
    );

    // Get next season number
    const lastSeason = await Season.findOne().sort({ seasonNum: -1 });
    const nextSeasonNum = lastSeason ? lastSeason.seasonNum + 1 : 1;

    // Create new season
    const newSeason = new Season({
      seasonNum: nextSeasonNum,
      startDate: new Date(),
      isActive: true
    });

    await newSeason.save();

    // Reset all users' seasonal ELO to 1200
    await User.updateMany(
      {},
      { eloSeasonal: 1200 }
    );

    return NextResponse.json({
      message: 'New season started successfully',
      season: {
        seasonNum: newSeason.seasonNum,
        startDate: newSeason.startDate,
        isActive: newSeason.isActive
      }
    });
  } catch (error) {
    console.error('Start new season error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
