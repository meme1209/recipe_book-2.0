const License = require('../models/License');

module.exports = async function licenseAuth(req, res, next) {
  try {
    // allow index page and root without license
    if (req.method === 'GET' && (req.path === '/' || req.path === '/index.html')) {
      return next();
    }

    const key = (req.cookies && req.cookies.licenseKey) || req.get('x-license-key') || req.query.license;
    if (!key) {
      console.debug('[licenseAuth] missing license key for', req.path);
      return res.status(403).json({ error: 'license required' });
    }

    const license = await License.findOne({ key });
    if (!license) {
      console.debug('[licenseAuth] invalid license key for', req.path);
      return res.status(403).json({ error: 'invalid license' });
    }
    if (license.isExpired()) {
      console.debug('[licenseAuth] expired license', license.key);
      return res.status(403).json({ error: 'license expired' });
    }

    if (!license.activated) {
      license.activated = true;
      license.activatedAt = new Date();
      await license.save();
      console.debug('[licenseAuth] activated license', license.key);
    }

    req.license = license;
    next();
  } catch (err) {
    next(err);
  }
};

// Add a helper to wrap static middleware so you can protect static file serving
// without changing middleware ordering. Example usage:
// app.use(licenseAuth.protectedStatic(express.static(path.join(__dirname, 'public'))))
module.exports.protectedStatic = function protectedStatic(staticMiddleware) {
  return function (req, res, next) {
    // Run licenseAuth; if it calls next() we continue to static middleware.
    // If licenseAuth sends a response (403), staticMiddleware won't run.
    module.exports(req, res, function (err) {
      if (err) return next(err);
      staticMiddleware(req, res, next);
    });
  };
};
