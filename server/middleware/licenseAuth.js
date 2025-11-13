const License = require('../models/License');

module.exports = async function licenseAuth(req, res, next) {
  try {
    console.log('[licenseAuth] cookies:', req.cookies);
    console.log('[licenseAuth] x-license-key header:', req.get('x-license-key'));
    console.log('[licenseAuth] query license:', req.query.license);

    // --- Allow open paths ---
    const openPaths = [
      '/',
      '/index.html',
      '/license.html',
      '/manifest.json',
      '/service-worker.js',
      '/favicon.ico',
      '/robots.txt'
    ];

    if (
      req.method === 'GET' &&
      (openPaths.includes(req.path) || req.path.endsWith('style.css') || req.path.startsWith('/assets/') || req.path.startsWith('/static/'))
    ) {
      console.log('[licenseAuth] open path, skipping license check for', req.path);
      return next();
    }

    // --- Get license key ---
    const key = req.cookies?.licenseKey || req.get('x-license-key') || req.query.license;

    if (!key) {
      console.warn('[licenseAuth] missing license key for', req.path);
      if (req.method === 'GET' && req.accepts && req.accepts('html')) {
        const redirectTo = encodeURIComponent(req.originalUrl || req.url || req.path);
        return res.redirect('/license.html?redirect=' + redirectTo);
      }
      return res.status(403).json({ error: 'license required' });
    }

    console.log('[licenseAuth] received license key:', key);

    // --- Lookup license in DB ---
    const license = await License.findOne({ key });
    if (!license) {
      console.warn('[licenseAuth] invalid license key for', req.path);
      if (req.method === 'GET' && req.accepts && req.accepts('html')) {
        const redirectTo = encodeURIComponent(req.originalUrl || req.url || req.path);
        return res.redirect('/license.html?redirect=' + redirectTo);
      }
      return res.status(403).json({ error: 'invalid license' });
    }

    // --- Check expiration ---
    if (typeof license.isExpired === 'function' && license.isExpired()) {
      console.warn('[licenseAuth] expired license', license.key);
      if (req.method === 'GET' && req.accepts && req.accepts('html')) {
        const redirectTo = encodeURIComponent(req.originalUrl || req.url || req.path);
        return res.redirect('/license.html?redirect=' + redirectTo);
      }
      return res.status(403).json({ error: 'license expired' });
    }

    // --- Auto-activate if not activated ---
    if (!license.activated) {
      console.log('[licenseAuth] license not activated, activating now:', license.key);
      license.activated = true;
      license.activatedAt = new Date();
      await license.save();
      console.log('[licenseAuth] license activated:', license.key);
    } else {
      console.log('[licenseAuth] license already activated:', license.key);
    }

    // --- Attach license to request ---
    req.license = license;
    console.log('[licenseAuth] license verification passed for', license.key);

    next();
  } catch (err) {
    console.error('[licenseAuth] error:', err);
    next(err);
  }
};

// --- Helper for protecting static middleware ---
module.exports.protectedStatic = function protectedStatic(staticMiddleware) {
  return function (req, res, next) {
    module.exports(req, res, function (err) {
      if (err) return next(err);
      staticMiddleware(req, res, next);
    });
  };
};
