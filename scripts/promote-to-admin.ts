import { config } from 'dotenv';
import { resolve } from 'path';
import mongoose from 'mongoose';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import User from '../models/User';

async function promoteToAdmin() {
  console.log('Starting user promotion to admin...');
  
  // Set a timeout for the entire operation
  const timeout = setTimeout(() => {
    console.error('❌ Script timed out after 30 seconds. Check if MongoDB is running.');
    process.exit(1);
  }, 30000);

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/unmatched-ranks';
    console.log('🔌 Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', mongoUri);
    
    // Direct mongoose connection instead of using the lib function
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully');

    // Find user with username "riggi"
    console.log('🔍 Looking for user with username "riggi"...');
    const user = await User.findOne({ username: 'riggi' });
    
    if (!user) {
      console.log('❌ User with username "riggi" not found');
      console.log('💡 Make sure the user exists in the database first');
      return;
    }

    console.log('👤 Found user:', {
      username: user.username,
      email: user.email,
      currentRole: user.role
    });

    if (user.role === 'admin') {
      console.log('ℹ️  User is already an admin');
      return;
    }

    // Promote user to admin
    console.log('⬆️  Promoting user to admin...');
    user.role = 'admin';
    await user.save();

    console.log('✅ User promoted to admin successfully!');
    console.log('   Username:', user.username);
    console.log('   Email:', user.email);
    console.log('   New Role:', user.role);

  } catch (error) {
    console.error('❌ Error promoting user to admin:');
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      if (error.message.includes('ECONNREFUSED')) {
        console.error('   💡 Make sure MongoDB is running on your system');
        console.error('   💡 Check if the MongoDB URI is correct');
      }
    } else {
      console.error('   Unknown error:', error);
    }
  } finally {
    clearTimeout(timeout);
    console.log('🏁 Script completed');
    await mongoose.disconnect();
    process.exit(0);
  }
}

promoteToAdmin();
