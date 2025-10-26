import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Match from '@/models/Match';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';
import { 
  calculateMatchEloChanges, 
  getTotalGames, 
  determineWinner, 
  isValidGamesWon 
} from '@/lib/elo';

// PUT /api/matches/[id] - Update match (winner, status)
export async function PUT(
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

    // Only admins can update matches
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { winner, status, p1GamesWon } = await request.json();
    const { id } = await params;

    await connectDB();

    const match = await Match.findById(id);
    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Handle admin direct resolution
    if (p1GamesWon !== undefined) {
      // Admin is directly setting the result
      if (!isValidGamesWon(p1GamesWon, match.format)) {
        return NextResponse.json(
          { error: `Invalid games won count for ${match.format}` },
          { status: 400 }
        );
      }

      const totalGames = getTotalGames(match.format);
      const winnerResult = determineWinner(p1GamesWon, match.format);
      
      if (!winnerResult) {
        return NextResponse.json(
          { error: 'Invalid match result' },
          { status: 400 }
        );
      }

      const winnerId = winnerResult === 1 ? match.player1Id : match.player2Id;
      
      // Update match with resolved result
      match.winner = winnerId;
      match.status = 'Completed';
      match.resolvedP1GamesWon = p1GamesWon;

      // Calculate and apply ELO changes
      await applyEloChanges(match);
    } else {
      // Handle automatic resolution based on reports
      await resolveMatchFromReports(match);
    }

    await match.save();

    // Populate the response
    const populatedMatch = await Match.findById(match._id)
      .populate('player1Id', 'username')
      .populate('player2Id', 'username')
      .populate('winner', 'username');

    return NextResponse.json({
      message: 'Match updated successfully',
      match: populatedMatch
    });
  } catch (error) {
    console.error('Update match error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to apply ELO changes to users
async function applyEloChanges(match: any) {
  const totalGames = getTotalGames(match.format);
  const p1GamesWon = match.resolvedP1GamesWon;

  // Calculate ELO changes for lifetime ratings
  const lifetimeChanges = calculateMatchEloChanges(
    match.eloLifetimeStartP1,
    match.eloLifetimeStartP2,
    p1GamesWon,
    totalGames
  );

  // Calculate ELO changes for seasonal ratings
  const seasonalChanges = calculateMatchEloChanges(
    match.eloSeasonalStartP1,
    match.eloSeasonalStartP2,
    p1GamesWon,
    totalGames
  );

  // Update both players' ratings atomically
  await User.updateOne(
    { _id: match.player1Id },
    { 
      $inc: { 
        eloLifetime: lifetimeChanges.player1Change,
        eloSeasonal: seasonalChanges.player1Change
      }
    }
  );

  await User.updateOne(
    { _id: match.player2Id },
    { 
      $inc: { 
        eloLifetime: lifetimeChanges.player2Change,
        eloSeasonal: seasonalChanges.player2Change
      }
    }
  );

  console.log(`ELO changes applied: P1 +${lifetimeChanges.player1Change.toFixed(1)} lifetime, +${seasonalChanges.player1Change.toFixed(1)} seasonal`);
  console.log(`ELO changes applied: P2 +${lifetimeChanges.player2Change.toFixed(1)} lifetime, +${seasonalChanges.player2Change.toFixed(1)} seasonal`);
}

// Helper function to resolve match based on reports
async function resolveMatchFromReports(match: any) {
  if (match.reports.length === 0) {
    return; // No reports yet
  }

  if (match.reports.length === 1) {
    // Only one report - could auto-resolve after 48h, but for now leave as pending
    return;
  }

  if (match.reports.length === 2) {
    const [report1, report2] = match.reports;
    
    // Check if reports agree
    const reportsAgree = 
      report1.reportedWinnerId.toString() === report2.reportedWinnerId.toString() &&
      report1.reportedP1GamesWon === report2.reportedP1GamesWon;

    if (reportsAgree) {
      // Reports agree - resolve the match
      match.winner = report1.reportedWinnerId;
      match.status = 'Completed';
      match.resolvedP1GamesWon = report1.reportedP1GamesWon;

      // Apply ELO changes
      await applyEloChanges(match);
    } else {
      // Reports disagree - mark as disputed
      match.status = 'Disputed';
    }
  }
}
