import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Match from '@/models/Match';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';
import { isValidGamesWon, getTotalGames, calculateMatchEloChanges } from '@/lib/elo';

// Helper function to calculate and apply ELO changes
async function calculateAndApplyELOChanges(match: { 
  player1Id: string; 
  player2Id: string; 
  eloLifetimeStartP1: number; 
  eloLifetimeStartP2: number; 
  eloSeasonalStartP1: number; 
  eloSeasonalStartP2: number; 
  resolvedP1GamesWon: number; 
  format: 'best-of-1' | 'best-of-3'; 
}) {
  const p1GamesWon = match.resolvedP1GamesWon;
  const totalGames = getTotalGames(match.format);
  
  // Calculate ELO changes
  const lifetimeChanges = calculateMatchEloChanges(
    match.eloLifetimeStartP1, match.eloLifetimeStartP2, p1GamesWon, totalGames
  );
  const seasonalChanges = calculateMatchEloChanges(
    match.eloSeasonalStartP1, match.eloSeasonalStartP2, p1GamesWon, totalGames
  );

  const player1Won = p1GamesWon > (totalGames - p1GamesWon);
  const player2Won = !player1Won;

  // Update both players' ELO and stats atomically
  await User.updateOne(
    { _id: match.player1Id },
    { $inc: { eloLifetime: lifetimeChanges.player1Change, eloSeasonal: seasonalChanges.player1Change, matchesPlayed: 1, wins: player1Won ? 1 : 0 } }
  );
  await User.updateOne(
    { _id: match.player2Id },
    { $inc: { eloLifetime: lifetimeChanges.player2Change, eloSeasonal: seasonalChanges.player2Change, matchesPlayed: 1, wins: player2Won ? 1 : 0 } }
  );

  console.log(`ELO changes applied: P1 +${lifetimeChanges.player1Change.toFixed(1)} lifetime, +${seasonalChanges.player1Change.toFixed(1)} seasonal`);
  console.log(`ELO changes applied: P2 +${lifetimeChanges.player2Change.toFixed(1)} lifetime, +${seasonalChanges.player2Change.toFixed(1)} seasonal`);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const { reportedWinnerId, reportedP1GamesWon } = await request.json();

    if (!reportedWinnerId || reportedP1GamesWon === undefined) {
      return NextResponse.json(
        { error: 'Winner ID and games won are required' },
        { status: 400 }
      );
    }

    await connectDB();
    const match = await Match.findById(id);

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.status === 'Completed') {
      return NextResponse.json(
        { error: 'Match is already completed' },
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

    // Check if this user has already reported
    const existingReportIndex = match.reports.findIndex((report: { reporterId: string }) => 
      report.reporterId.toString() === reporterId
    );

    if (existingReportIndex >= 0) {
      // Update existing report
      match.reports[existingReportIndex] = {
        reporterId,
        reportedWinnerId,
        reportedP1GamesWon,
        reportedAt: new Date()
      };
    } else {
      // Add new report
      match.reports.push({
        reporterId,
        reportedWinnerId,
        reportedP1GamesWon,
        reportedAt: new Date()
      });
    }

    // Check if both players have reported
    if (match.reports.length === 2) {
      const [report1, report2] = match.reports;
      
      // Check if reports agree (convert to strings for comparison)
      const reportsAgree = report1.reportedWinnerId.toString() === report2.reportedWinnerId.toString() &&
                          report1.reportedP1GamesWon === report2.reportedP1GamesWon;

      if (reportsAgree) {
        // Auto-resolve the match
        match.winner = report1.reportedWinnerId;
        match.resolvedP1GamesWon = report1.reportedP1GamesWon;
        match.status = 'Completed';
        
        // Calculate and apply ELO changes
        await calculateAndApplyELOChanges(match);
      } else {
        // Reports disagree - set to disputed
        match.status = 'Disputed';
      }
    } else {
      // Only one report so far - set provisional status (first report is accepted)
      match.status = 'Pending';
      // Set provisional winner and games won based on first report
      match.winner = match.reports[0].reportedWinnerId;
      match.resolvedP1GamesWon = match.reports[0].reportedP1GamesWon;
    }

    await match.save();

    return NextResponse.json({
      message: 'Match report submitted successfully',
      match: {
        id: match._id,
        status: match.status,
        winner: match.winner,
        resolvedP1GamesWon: match.resolvedP1GamesWon
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Submit match report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve current report for editing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const match = await Match.findById(id);

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Find the current user's report
    const userReport = match.reports.find((report: { reporterId: string }) => 
      report.reporterId.toString() === currentUser.userId
    );

    if (!userReport) {
      return NextResponse.json({ error: 'No report found for this user' }, { status: 404 });
    }

    return NextResponse.json({
      report: {
        reportedWinnerId: userReport.reportedWinnerId,
        reportedP1GamesWon: userReport.reportedP1GamesWon,
        reportedAt: userReport.reportedAt
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Get match report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}