const mongoose = require('mongoose');
const crypto = require('crypto');
const License = require('../models/License');

// ✅ Make sure the database name (recipebook) is explicitly included:
const MONGO_URI = process.env.MONGO_URI 
  || 'mongodb+srv://abramwaldner4_db_user:waldnerJacobi1@recipebook.dwb8f9n.mongodb.net/recipebook?retryWrites=true&w=majority';

async function generateLicense(isAdmin = false, days = 3650) {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Generate a random 32-character key
    const key = crypto.randomBytes(16).toString('hex');

    // Optional: add expiry field if your schema supports it
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    // Save new license
    const license = new License({
      key,
      isAdmin,
      activated: false,
      expiresAt,
    });

    await license.save();

    console.log(isAdmin ? '🎟️ Admin license created:' : '🎫 User license created:');
    console.log(`🔑 License key: ${key}`);
    console.log(`📅 Expires: ${expiresAt.toISOString()}`);

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  } catch (err) {
    console.error('❌ Error generating license:', err);
  }
}

// Run this once to create an admin license
generateLicense(true);
