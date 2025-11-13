// server/utils/generateLicense.js
// Usage:
//  node generateLicense.js                  -> creates 1 non-admin license, 365 days
//  node generateLicense.js 5                -> creates 5 non-admin licenses, 365 days
//  node generateLicense.js 5 365            -> creates 5 non-admin licenses, 365 days
//  node generateLicense.js 1 365 explicitKey -> creates 1 license with explicitKey (non-admin)
//  node generateLicense.js count days key isAdmin
//  Provide env var MONGO_URI to override the built-in connection string.

const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');
const License = require('../models/License'); // adjust path if you place this elsewhere

// default to your Atlas connection string (you may prefer to set MONGO_URI env var)
const MONGO_URI = process.env.MONGO_URI ||
  'mongodb+srv://abramwaldner4_db_user:waldnerJacobi1@recipebook.dwb8f9n.mongodb.net/recipebook?retryWrites=true&w=majority';

// parse CLI args
// args: [count] [days] [explicitKey] [isAdmin]
// e.g. node generateLicense.js 10 365          -> create 10 non-admin, 365 days
// e.g. node generateLicense.js 1 365 mykey true -> create 1 admin license with key "mykey"
const argv = process.argv.slice(2);
let count = 1;
let days = 365;
let explicitKey = null;
let isAdmin = false;

if (argv.length >= 1) {
  const maybeCount = parseInt(argv[0], 10);
  if (!Number.isNaN(maybeCount)) count = maybeCount;
  else explicitKey = argv[0];
}
if (argv.length >= 2) {
  const maybeDays = parseInt(argv[1], 10);
  if (!Number.isNaN(maybeDays)) days = maybeDays;
  else if (!explicitKey) explicitKey = argv[1];
}
if (argv.length >= 3 && !explicitKey) {
  explicitKey = argv[2];
} else if (argv.length >= 3 && explicitKey && argv[2] === 'true') {
  // if only 3 args and third is "true", treat as isAdmin flag
  isAdmin = (argv[2] === 'true');
}
if (argv.length >= 4) {
  isAdmin = (argv[3] === 'true' || argv[3] === '1');
}

// Validate
if (!Number.isInteger(count) || count < 1) {
  console.error('Count must be a positive integer.');
  process.exit(2);
}
if (!Number.isInteger(days) || days < 1) {
  console.error('Days must be a positive integer.');
  process.exit(2);
}

// helper: generate a secure random key (32 hex chars)
function genKey() {
  return crypto.randomBytes(16).toString('hex'); // 32 hex characters
}

// ensure unique key (checks DB)
async function makeUniqueKey(proposed) {
  if (proposed) {
    const existing = await License.findOne({ key: proposed });
    if (!existing) return proposed;
    throw new Error('Explicit key already exists in DB: ' + proposed);
  }
  for (let i = 0; i < 10; i++) {
    const k = genKey();
    const exists = await License.findOne({ key: k });
    if (!exists) return k;
  }
  // fallback rarely used
  return genKey() + '-' + Date.now();
}

async function createLicenses() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const created = [];
    for (let i = 0; i < count; i++) {
      const useKey = (explicitKey && i === 0) ? explicitKey : null;
      const key = await makeUniqueKey(useKey);
      const expiresAt = new Date(Date.now() + days * 24 * 3600 * 1000);

      const licenseDoc = new License({
        key,
        activated: false,
        isAdmin,
        createdAt: new Date(),
        expiresAt,
      });

      await licenseDoc.save();
      created.push({ key: licenseDoc.key, expiresAt: licenseDoc.expiresAt.toISOString(), isAdmin: licenseDoc.isAdmin });
      console.log(`Created (${i + 1}/${count}): ${licenseDoc.key}  expires: ${licenseDoc.expiresAt.toISOString()}  admin: ${licenseDoc.isAdmin}`);
    }

    console.log('\nDone. Created licenses:');
    created.forEach((c, idx) => {
      console.log(`${idx + 1}: ${c.key}  expires: ${c.expiresAt}  admin: ${c.isAdmin}`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error creating licenses:', err);
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  }
}

createLicenses();
