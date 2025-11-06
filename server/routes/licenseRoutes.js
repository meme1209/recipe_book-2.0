const express = require('express');
const router = express.Router();
const License = require('../models/License');

// activate a license key (POST { key })
router.post('/activate', async (req, res, next) => {
  try {
    const { key } = req.body;
    if (!key) return res.status(400).json({ error: 'key required' });

    const license = await License.findOne({ key });
    if (!license) return res.status(404).json({ error: 'license not found' });
    if (license.isExpired()) return res.status(403).json({ error: 'license expired' });

    license.activated = true;
    license.activatedAt = new Date();
    await license.save();

    // set cookie for browser access
    res.cookie('licenseKey', key, { httpOnly: true, maxAge: license.expiresAt ? (license.expiresAt.getTime() - Date.now()) : 30 * 24 * 3600 * 1000 });

    // client can use this to redirect automatically
    if (license.isAdmin) return res.json({ ok: true, admin: true, redirect: '/admin/setup' });
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// create an admin license (POST { secret }) -> returns created key
// protect this route by ADMIN_CREATION_SECRET env var
router.post('/create-admin', async (req, res, next) => {
  try {
    const secret = req.body && req.body.secret;
    if (!process.env.ADMIN_CREATION_SECRET) return res.status(500).json({ error: 'server not configured' });
    if (!secret || secret !== process.env.ADMIN_CREATION_SECRET) return res.status(403).json({ error: 'forbidden' });

    const license = await License.generate({ isAdmin: true, days: 3650 });
    return res.json({ ok: true, key: license.key });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
