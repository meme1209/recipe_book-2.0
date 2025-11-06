// middleware/requireLicense.js
module.exports = function requireLicense(req, res, next) {
  if (!req.session || !req.session.licenseValid) {
    return res.status(403).send('Access denied. License required.');
  }
  next();
};