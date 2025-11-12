const License = require('../models/License');

module.exports = async function licenseAuth(req, res, next) {
  try {
    console.log('[licenseAuth] cookies:', req.cookies);
    console.log('[licenseAuth] x-license-key header:', req.get('x-license-key'));
    console.log('[licenseAuth] query license:', req.query.license);

    // Allow open pages (index, license, styles, static assets)
    if (
      req.method === 'GET' &&
      (
        req.path === '/' ||
        req.path === '/index.html' ||
        req.path === '/license.html' ||
        (typeof req.path === 'string' && req.path.endsWith('style.css')) ||
        req.path.startsWith('/assets/') ||
        req.path.startsWith('/static/') ||
        req.path === '/manifest.json' ||
        req.path === '/service-worker.js'
      )
    ) {
      console.log('[licenseAuth] open path, skipping license check for', req.path);
      return next();
    }

    // Read license key from cookies, headers, or query
    const key =
      (req.cookies && req.cookies.licenseKey) ||
      req.get('x-license-key') ||
      req.query.license;

    if (!key) {
      console.warn('[licenseAuth] missing license key for', req.path);

      // If browser HTML GET, redirect user to license entry page
      if (req.method === 'GET' && req.accepts && req.accepts('html')) {
        const redirectTo = encodeURIComponent(req.originalUrl || req.url || req.path);
        return res.redirect('/license.html?redirect=' + redirectTo);
      }

      return res.status(403).json({ error: 'license required' });
    }

    console.log('[licenseAuth] received license key:', key);

    // Lookup license in database
    const license = await License.findOne({ key });
    console.log('[licenseAuth] license lookup result:', license);

    if (!license) {
      console.warn('[licenseAuth] invalid license key for', req.path);
      if (req.method === 'GET' && req.accepts && req.accepts('html')) {
        const redirectTo = encodeURIComponent(req.originalUrl || req.url || req.path);
        return res.redirect('/license.html?redirect=' + redirectTo);
      }
      return res.status(403).json({ error: 'invalid license' });
    }

    // Check expiration
    if (typeof license.isExpired === 'function') {
      const expired = license.isExpired();
      console.log('[licenseAuth] license.isExpired() result:', expired);
      if (expired) {
        console.warn('[licenseAuth] expired license', license.key);
        if (req.method === 'GET' && req.accepts && req.accepts('html')) {
          const redirectTo = encodeURIComponent(req.originalUrl || req.url || req.path);
          return res.redirect('/license.html?redirect=' + redirectTo);
        }
        return res.status(403).json({ error: 'license expired' });
      }
    }

    // Auto-activate if not already activated
    if (!license.activated) {
      console.log('[licenseAuth] license not activated, activating now:', license.key);
      license.activated = true;
      license.activatedAt = new Date();
      await license.save();
      console.log('[licenseAuth] license activated:', license.key);
    } else {
      console.log('[licenseAuth] license already activated:', license.key);
    }

    req.license = license;
    console.log('[licenseAuth] license verification passed for', license.key);
    next();
  } catch (err) {
    console.error('[licenseAuth] error:', err);
    next(err);
  }
};

// Helper for static file protection (unchanged)
module.exports.protectedStatic = function protectedStatic(staticMiddleware) {
  return function (req, res, next) {
    module.exports(req, res, function (err) {
      if (err) return next(err);
      staticMiddleware(req, res, next);
    });
  };
};
