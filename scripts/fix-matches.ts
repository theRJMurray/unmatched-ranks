import { config } from 'dotenv';
import { resolve } from 'path';
import mongoose from 'mongoose';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import Match from '../models/Match';
import User from '../models/User';

async function fixMatches() {
  console.log('Fixing matches with missing ELO start values...');
  
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/unmatched-ranks';
    console.log('🔌 Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully');

    // Find matches missing ELO start values
    const matches = await Match.find({
      $or: [
        { eloLifetimeStartP1: { $exists: false } },
        { eloLifetimeStartP2: { $exists: false } },
        { eloSeasonalStartP1: { $exists: false } },
        { eloSeasonalStartP2: { $exists: false } }
      ]
    });

    console.log(`Found ${matches.length} matches to fix`);

    for (const match of matches) {
      // Get current ELO ratings for both players
      const players = await User.find({ _id: { $in: [match.player1Id, match.player2Id] } });
      
      if (players.length === 2) {
        const player1 = players.find(p => p._id.toString() === match.player1Id.toString());
        const player2 = players.find(p => p._id.toString() === match.player2Id.toString());
        
        if (player1 && player2) {
          // Update match with current ELO ratings
          await Match.updateOne(
            { _id: match._id },
            {
              eloLifetimeStartP1: player1.eloLifetime,
              eloLifetimeStartP2: player2.eloLifetime,
              eloSeasonalStartP1: player1.eloSeasonal,
              eloSeasonalStartP2: player2.eloSeasonal
            }
          );
          
          console.log(`✅ Fixed match ${match._id}`);
        }
      }
    }

    console.log('✅ All matches fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing matches:');
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    } else {
      console.error('   Unknown error:', error);
    }
  } finally {
    console.log('🏁 Fix script completed');
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixMatches();
