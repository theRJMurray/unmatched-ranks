import { config } from 'dotenv';
import { resolve } from 'path';
import mongoose from 'mongoose';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import User from '../models/User';

async function checkUserRole() {
  console.log('Checking user role in database...');
  
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/unmatched-ranks';
    console.log('🔌 Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully');

    // Find user with username "riggi"
    console.log('🔍 Looking for user with username "riggi"...');
    const user = await User.findOne({ username: 'riggi' });
    
    if (!user) {
      console.log('❌ User with username "riggi" not found');
      return;
    }

    console.log('👤 User found:');
    console.log('   Username:', user.username);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Role Audit:', user.roleAudit);

  } catch (error) {
    console.error('❌ Error checking user role:');
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    } else {
      console.error('   Unknown error:', error);
    }
  } finally {
    console.log('🏁 Script completed');
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkUserRole();
