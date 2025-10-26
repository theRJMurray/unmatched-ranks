import { config } from 'dotenv';
import { resolve } from 'path';
import mongoose from 'mongoose';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import User from '../models/User';
import Match from '../models/Match';
import { calculateEloChange, calculateMatchEloChanges, getTotalGames } from '../lib/elo';

async function testEloSystem() {
  console.log('🧪 Testing ELO calculation system...');
  
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/unmatched-ranks';
    console.log('🔌 Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully');

    // Test 1: Basic ELO calculation
    console.log('\n📊 Test 1: Basic ELO calculation');
    const player1Rating = 1500;
    const player2Rating = 1500;
    
    const winChange = calculateEloChange(player1Rating, player2Rating, 1);
    const lossChange = calculateEloChange(player1Rating, player2Rating, 0);
    
    console.log(`Player 1 (${player1Rating}) vs Player 2 (${player2Rating}):`);
    console.log(`  Win: +${winChange.toFixed(1)} ELO`);
    console.log(`  Loss: ${lossChange.toFixed(1)} ELO`);

    // Test 2: Match ELO calculation (best-of-1)
    console.log('\n📊 Test 2: Best-of-1 match calculation');
    const bo1Changes = calculateMatchEloChanges(player1Rating, player2Rating, 1, 1);
    console.log(`Best-of-1, Player 1 wins: P1 +${bo1Changes.player1Change.toFixed(1)}, P2 ${bo1Changes.player2Change.toFixed(1)}`);

    // Test 3: Match ELO calculation (best-of-3)
    console.log('\n📊 Test 3: Best-of-3 match calculation');
    const bo3Changes = calculateMatchEloChanges(player1Rating, player2Rating, 2, 3);
    console.log(`Best-of-3, Player 1 wins 2-1: P1 +${bo3Changes.player1Change.toFixed(1)}, P2 ${bo3Changes.player2Change.toFixed(1)}`);

    // Test 4: Rating difference impact
    console.log('\n📊 Test 4: Rating difference impact');
    const highRating = 1800;
    const lowRating = 1200;
    
    const highWinChange = calculateEloChange(highRating, lowRating, 1);
    const lowWinChange = calculateEloChange(lowRating, highRating, 1);
    
    console.log(`High-rated player (${highRating}) beats low-rated (${lowRating}): +${highWinChange.toFixed(1)} ELO`);
    console.log(`Low-rated player (${lowRating}) beats high-rated (${highRating}): +${lowWinChange.toFixed(1)} ELO`);

    // Test 5: Check existing users and matches
    console.log('\n📊 Test 5: Database check');
    const userCount = await User.countDocuments();
    const matchCount = await Match.countDocuments();
    
    console.log(`Users in database: ${userCount}`);
    console.log(`Matches in database: ${matchCount}`);

    if (userCount >= 2) {
      const users = await User.find().limit(2);
      console.log(`Sample users: ${users.map(u => `${u.username} (L:${u.eloLifetime}, S:${u.eloSeasonal})`).join(', ')}`);
    }

    if (matchCount > 0) {
      const recentMatch = await Match.findOne().sort({ createdAt: -1 });
      console.log(`Recent match: ${recentMatch?.player1Id} vs ${recentMatch?.player2Id}, Status: ${recentMatch?.status}`);
    }

    console.log('\n✅ ELO system tests completed successfully!');

  } catch (error) {
    console.error('❌ Error testing ELO system:');
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    } else {
      console.error('   Unknown error:', error);
    }
  } finally {
    console.log('🏁 Test script completed');
    await mongoose.disconnect();
    process.exit(0);
  }
}

testEloSystem();
