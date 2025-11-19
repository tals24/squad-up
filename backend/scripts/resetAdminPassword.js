require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

// Get command line arguments
const args = process.argv.slice(2);
const email = args.find(arg => arg.startsWith('--email='))?.split('=')[1];
const newPassword = args.find(arg => arg.startsWith('--password='))?.split('=')[1];

async function resetAdminPassword() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/squadup';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find admin user
    let adminUser;
    if (email) {
      console.log(`🔍 Looking for admin user with email: ${email}`);
      adminUser = await User.findOne({ email: email.toLowerCase(), role: 'Admin' });
    } else {
      console.log('🔍 Looking for any admin user...');
      adminUser = await User.findOne({ role: 'Admin' });
    }

    if (!adminUser) {
      console.error('❌ No admin user found!');
      console.log('\n💡 Options:');
      console.log('   1. Specify an email: node resetAdminPassword.js --email=admin@example.com --password=newpassword123');
      console.log('   2. Create a new admin user using the register endpoint');
      process.exit(1);
    }

    console.log(`✅ Found admin user: ${adminUser.fullName} (${adminUser.email})`);

    // Get new password
    let password = newPassword;
    if (!password) {
      // If password not provided, prompt for it
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      password = await new Promise((resolve) => {
        rl.question('Enter new password (min 6 characters): ', (pwd) => {
          rl.close();
          resolve(pwd);
        });
      });
    }

    if (!password || password.length < 6) {
      console.error('❌ Password must be at least 6 characters long');
      process.exit(1);
    }

    // Update password (will be automatically hashed by pre-save middleware)
    adminUser.password = password;
    await adminUser.save();

    console.log('✅ Admin password has been reset successfully!');
    console.log(`📧 Email: ${adminUser.email}`);
    console.log(`🔑 New password: ${password}`);
    console.log('\n⚠️  Please change this password after logging in for security.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting admin password:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
resetAdminPassword();

