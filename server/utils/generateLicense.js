const mongoose = require('mongoose');
const crypto = require('crypto');
const License = require('../models/License');

// Replace with your actual MongoDB URI
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://abramwaldner4_db_user:waldnerJacobi1@recipe.yukpwu3.mongodb.net/?appName=recipe';

async function generateLicense(isAdmin = false) {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const key = crypto.randomBytes(16).toString('hex');
    const license = new License({ key, isAdmin });
    await license.save();

    console.log(isAdmin ? 'Admin license created:' : 'User license created:');
    console.log(key);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (err) {
    console.error(err);
  }
}

// Run this once to create your admin license
generateLicense(true);
