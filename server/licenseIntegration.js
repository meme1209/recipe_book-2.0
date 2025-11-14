const cookieParser = require('cookie-parser');
const licenseRoutes = require('./routes/licenseRoutes');
const licenseAuth = require('./middleware/licenseAuth');

module.exports = function licenseIntegration(app, express) {
  
  // Parse cookies & JSON ONCE
  app.use(cookieParser());
  app.use(express.json());

  // 1️⃣ License activation routes — must be FIRST
  app.use('/api/license', licenseRoutes);

  // 2️⃣ Paths that NEVER require a license (only what's necessary)
  const ALWAYS_ALLOWED = [
    '/license.html',
    '/api/license/activate',
    '/api/license/verify',
    '/manifest.json',
    '/service-worker.js',
    '/favicon.ico',
    '/'
  ];

  app.use((req, res, next) => {
    const path = req.path;

    console.log('[licenseIntegration] Checking path:', path);

    // A — Always allow activation/verify & license.html
    if (ALWAYS_ALLOWED.includes(path)) {
      return next();
    }

    // B — Allow static files (CSS/JS/images/fonts)
    if (
      path.startsWith('/css/') ||
      path.startsWith('/js/') ||
      path.startsWith('/images/') ||
      path.startsWith('/recipes/') ||
      path.endsWith('.css') ||
      path.endsWith('.js') ||
      path.endsWith('.png') ||
      path.endsWith('.jpg') ||
      path.endsWith('.jpeg') ||
      path.endsWith('.gif') ||
      path.endsWith('.svg') ||
      path.endsWith('.woff') ||
      path.endsWith('.woff2')
    ) {
      return next();
    }

    // C — Everything else requires a valid license
    return licenseAuth(req, res, next);
  });
};
