const mongoose = require('mongoose');
const License = require('./models/License');

async function createLicense() {
  await mongoose.connect('mongodb://localhost:27017/recipebook');

  const license = new License({
    key: 'MY_NEW_LICENSE_KEY',
    activated: false,
    isAdmin: false,
    expiresAt: new Date(Date.now() + 365*24*3600*1000)
  });

  await license.save();
  console.log('License created:', license);
  process.exit();
}

createLicense();
