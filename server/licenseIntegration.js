const cookieParser = require('cookie-parser');
const licenseRoutes = require('./routes/licenseroutes'); // note lowercase filename
const licenseAuth = require('./middleware/licenseAuth');

module.exports = function licenseIntegration(app, express) {
  app.use(cookieParser());
  app.use(express.json());

  // 1️⃣ Mount license routes first — activate & verify
  app.use('/license', licenseRoutes);

  // 2️⃣ Apply licenseAuth middleware for all other routes
  app.use((req, res, next) => {
    const receivedLicense = req.headers['x-license-key'] || req.cookies?.licenseKey || 'none';
    console.log('[licenseIntegration] Received license:', receivedLicense);
    console.log('[licenseIntegration] Request path:', req.path);

    const openPaths = [
      '/service-worker.js',
      '/manifest.json',
      '/favicon.ico',
      '/robots.txt',
      '/license.html',
      '/',
      '/index.html'
    ];

    if (openPaths.includes(req.path) || req.path.endsWith('style.css') || req.path.startsWith('/assets/') || req.path.startsWith('/static/')) {
      console.log('[licenseIntegration] Open/static path, skipping license check');
      return next();
    }

    return licenseAuth(req, res, next);
  });
};
