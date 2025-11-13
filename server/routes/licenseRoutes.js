const express = require('express');
const router = express.Router();
const License = require('../models/License');
const licenseAuth = require('../middleware/licenseAuth');

// --- Activate a license key ---
// POST /license/activate { key }
// ✅ Remove licenseAuth middleware here
router.post('/activate', async (req, res, next) => {
  try {
    const { key } = req.body;
    if (!key) return res.status(400).json({ error: 'key required' });

    const license = await License.findOne({ key });
    if (!license) return res.status(404).json({ error: 'license not found' });
    if (license.isExpired()) return res.status(403).json({ error: 'license expired' });

    // Mark as activated
    license.activated = true;
    license.activatedAt = new Date();
    await license.save();

    // Set cookie
    res.cookie('licenseKey', key, {
      httpOnly: true,
      path: '/',
      maxAge: license.expiresAt ? (license.expiresAt.getTime() - Date.now()) : 30 * 24 * 3600 * 1000,
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production'
    });

    return res.json({ ok: true, license });
  } catch (err) {
    next(err);
  }
});

// --- Verify a license key ---
// POST /license/verify { key }
router.post('/verify', async (req, res, next) => {
  try {
    const { key } = req.body;
    if (!key) return res.status(400).json({ error: 'key required' });

    const license = await License.findOne({ key });
    if (!license) return res.status(404).json({ error: 'license not found' });
    if (license.isExpired()) return res.status(403).json({ error: 'license expired' });

    return res.json({ license });
  } catch (err) {
    next(err);
  }
});

// --- Create an admin license ---
// POST /license/create-admin { secret }
router.post('/create-admin', async (req, res, next) => {
  try {
    const secret = req.body?.secret;
    if (!process.env.ADMIN_CREATION_SECRET) return res.status(500).json({ error: 'server not configured' });
    if (!secret || secret !== process.env.ADMIN_CREATION_SECRET) return res.status(403).json({ error: 'forbidden' });

    const license = await License.generate({ isAdmin: true, days: 3650 });
    return res.json({ ok: true, key: license.key });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
