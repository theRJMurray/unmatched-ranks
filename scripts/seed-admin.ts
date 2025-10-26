import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import connectDB from '../lib/mongodb';
import User from '../models/User';

async function seedAdmin() {
  console.log('Starting admin user seed...');
  
  // Set a timeout for the entire operation
  const timeout = setTimeout(() => {
    console.error('❌ Seed script timed out after 30 seconds. Check if MongoDB is running.');
    process.exit(1);
  }, 30000);

  try {
    console.log('🔌 Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/unmatched-ranks');
    
    await connectDB();
    console.log('✅ Connected to MongoDB successfully');

    // Check if admin user already exists
    console.log('🔍 Checking for existing admin user...');
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists:', existingAdmin.username);
      console.log('   Email:', existingAdmin.email);
      console.log('   Role:', existingAdmin.role);
      return;
    }

    // Create admin user
    console.log('👤 Creating new admin user...');
    const adminUser = new User({
      username: 'admin',
      email: 'admin@unmatched-ranks.com',
      password: 'admin123', // This will be hashed by the pre-save middleware
      role: 'admin',
      eloLifetime: 1500,
      eloSeasonal: 1200
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('   Username:', adminUser.username);
    console.log('   Email:', adminUser.email);
    console.log('   Role:', adminUser.role);
    console.log('   Password: admin123 (CHANGE THIS AFTER FIRST LOGIN!)');

  } catch (error) {
    console.error('❌ Error seeding admin user:');
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
    console.log('🏁 Seed script completed');
    process.exit(0);
  }
}

seedAdmin();
