const crypto = require('crypto');
const License = require('../models/License');
const generateLicense = require('./generateLicense');

// Run this once to create your admin license
generateLicense(true).then(key => {
  console.log('Your admin license key:', key);
});

async function generateLicense(isAdmin = false) {
  const key = crypto.randomBytes(16).toString('hex');
  const license = new License({ key, isAdmin });
  await license.save();
  return key;
}

module.exports = generateLicense;