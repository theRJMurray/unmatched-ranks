import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Match from '@/models/Match';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';
import { isValidGamesWon, getTotalGames } from '@/lib/elo';

// POST /api/matches/[id]/report - Submit a match report
export async function POST(
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
    const { reportedWinnerId, reportedP1GamesWon } = await request.json();

    // Validation
    if (!reportedWinnerId || reportedP1GamesWon === undefined) {
      return NextResponse.json(
        { error: 'reportedWinnerId and reportedP1GamesWon are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the match
    const match = await Match.findById(id);
    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Check if match is still pending
    if (match.status !== 'Pending') {
      return NextResponse.json(
        { error: 'Match is no longer pending' },
        { status: 400 }
      );
    }

    // Validate games won count
    if (!isValidGamesWon(reportedP1GamesWon, match.format)) {
      return NextResponse.json(
        { error: `Invalid games won count for ${match.format}` },
        { status: 400 }
      );
    }

    // Verify the reporter is one of the players
    const reporterId = currentUser.userId;
    if (reporterId !== match.player1Id.toString() && reporterId !== match.player2Id.toString()) {
      return NextResponse.json(
        { error: 'Only match participants can report results' },
        { status: 403 }
      );
    }

    // Verify the reported winner is one of the players
    if (reportedWinnerId !== match.player1Id.toString() && reportedWinnerId !== match.player2Id.toString()) {
      return NextResponse.json(
        { error: 'Reported winner must be one of the match participants' },
        { status: 400 }
      );
    }

    // Check if this user has already reported
    const existingReport = match.reports.find((report: any) => 
      report.reporterId.toString() === reporterId
    );

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this match' },
        { status: 400 }
      );
    }

    // Add the report
    match.reports.push({
      reporterId,
      reportedWinnerId,
      reportedP1GamesWon,
      reportedAt: new Date()
    });

    await match.save();

    return NextResponse.json({
      message: 'Match report submitted successfully',
      report: {
        reporterId,
        reportedWinnerId,
        reportedP1GamesWon,
        reportedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Submit match report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
