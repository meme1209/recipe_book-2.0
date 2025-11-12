const cookieParser = require('cookie-parser');
const licenseRoutes = require('./routes/licenseRoutes');
const licenseAuth = require('./middleware/licenseAuth');

module.exports = function licenseIntegration(app, express) {
  // Parse cookies and JSON
  app.use(cookieParser());
  app.use(express.json());

  // Mount license routes at /api/license
  app.use('/api/license', licenseRoutes);

  // Exclude open paths from license checks
  const openPaths = [
    '/service-worker.js',
    '/manifest.json',
    '/favicon.ico',
    '/robots.txt'
  ];

  // License middleware for all other routes
  app.use((req, res, next) => {
    const receivedLicense = req.headers['x-license-key'] || req.cookies?.licenseKey || 'none';
    console.log('[licenseIntegration] Received license:', receivedLicense);
    console.log('[licenseIntegration] Request path:', req.path);

    // Skip license check for open/static paths
    if (
      openPaths.includes(req.path) ||
      req.path.startsWith('/assets/') ||
      req.path.startsWith('/static/')
    ) {
      console.log('[licenseIntegration] Open/static path, skipping license check');
      return next();
    }

    console.log('[licenseIntegration] Running licenseAuth middleware...');
    return licenseAuth(req, res, (err) => {
      if (err) {
        console.error('[licenseIntegration] licenseAuth middleware error:', err);
        return res.status(500).send('License verification failed');
      }
      console.log('[licenseIntegration] licenseAuth middleware passed, proceeding to next handler');
      next();
    });
  });
};
