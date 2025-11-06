const License = require('../models/License');

module.exports = async function verifyLicense(req, res, next) {
  const { licenseKey } = req.body;
  const license = await License.findOne({ key: licenseKey });

  if (!license) return res.status(401).json({ error: 'Invalid license key' });

  if (license.activated && new Date() > license.expiresAt)
    return res.status(403).json({ error: 'License expired' });

  if (!license.activated) {
    license.activated = true;
    license.activatedAt = new Date();
    license.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    await license.save();
  }

  req.session.licenseValid = true;
  req.session.isAdmin = license.isAdmin;
  req.license = license;
  next();
};