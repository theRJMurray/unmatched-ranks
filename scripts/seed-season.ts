import { config } from 'dotenv';
import { resolve } from 'path';
import mongoose from 'mongoose';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import Season from '../models/Season';

async function seedSeason() {
  console.log('Seeding initial season...');
  
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/unmatched-ranks';
    console.log('🔌 Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully');

    // Check if any seasons exist
    const existingSeasons = await Season.countDocuments();
    
    if (existingSeasons > 0) {
      console.log('ℹ️  Seasons already exist, skipping seed');
      return;
    }

    // Create initial season
    const season = new Season({
      seasonNum: 1,
      startDate: new Date(),
      isActive: true
    });

    await season.save();
    console.log('✅ Initial season created successfully!');
    console.log('   Season Number:', season.seasonNum);
    console.log('   Start Date:', season.startDate);
    console.log('   Active:', season.isActive);

  } catch (error) {
    console.error('❌ Error seeding season:');
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    } else {
      console.error('   Unknown error:', error);
    }
  } finally {
    console.log('🏁 Seed script completed');
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedSeason();
