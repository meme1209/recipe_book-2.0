const License = require('../models/License');

module.exports = async function licenseAuth(req, res, next) {
  try {
    // allow index page, root, license page, and style.css without license
    if (req.method === 'GET' && (
      req.path === '/' ||
      req.path === '/index.html' ||
      req.path === '/license.html' ||
      // allow any path that ends with style.css (e.g. /style.css or /css/style.css)
      (typeof req.path === 'string' && req.path.endsWith('style.css'))
    )) {
      return next();
    }

    const key = (req.cookies && req.cookies.licenseKey) || req.get('x-license-key') || req.query.license;
    if (!key) {
      console.debug('[licenseAuth] missing license key for', req.path);
      // If this is a browser HTML GET, redirect to license entry page with original URL so user can come back after entering key.
      if (req.method === 'GET' && req.accepts && req.accepts('html')) {
        const redirectTo = encodeURIComponent(req.originalUrl || req.url || req.path);
        return res.redirect('/license.html?redirect=' + redirectTo);
      }
      return res.status(403).json({ error: 'license required' });
    }

    const license = await License.findOne({ key });
    if (!license) {
      console.debug('[licenseAuth] invalid license key for', req.path);
      if (req.method === 'GET' && req.accepts && req.accepts('html')) {
        const redirectTo = encodeURIComponent(req.originalUrl || req.url || req.path);
        return res.redirect('/license.html?redirect=' + redirectTo);
      }
      return res.status(403).json({ error: 'invalid license' });
    }
    if (license.isExpired()) {
      console.debug('[licenseAuth] expired license', license.key);
      if (req.method === 'GET' && req.accepts && req.accepts('html')) {
        const redirectTo = encodeURIComponent(req.originalUrl || req.url || req.path);
        return res.redirect('/license.html?redirect=' + redirectTo);
      }
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
    // If licenseAuth sends a response (403 or redirect), staticMiddleware won't run.
    module.exports(req, res, function (err) {
      if (err) return next(err);
      staticMiddleware(req, res, next);
    });
  };
};
