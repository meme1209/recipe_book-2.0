const express = require('express');
const License = require('../models/License');

const router = express.Router();

// POST /verify
// Accepts key in body.key, x-license-key header, cookie 'licenseKey', or query. Returns 200 + { ok:true, license } on success.
router.post('/verify', async (req, res, next) => {
  try {
    const key = req.get('x-license-key') || (req.body && req.body.key) || (req.cookies && req.cookies.licenseKey) || req.query.license;
    if (!key) return res.status(400).json({ ok: false, error: 'no_key' });

    const license = await License.findOne({ key });
    if (!license) return res.status(404).json({ ok: false, error: 'invalid' });

    if (license.isExpired && typeof license.isExpired === 'function' && license.isExpired()) {
      return res.status(403).json({ ok: false, error: 'expired' });
    }

    // return some safe fields
    return res.json({
      ok: true,
      license: {
        key: license.key,
        activated: !!license.activated,
        activatedAt: license.activatedAt || null,
        expiresAt: license.expiresAt || null
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
