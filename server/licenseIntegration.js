module.exports = function integrateLicense(app, express) {
  const path = require('path');
  const cookieParser = require('cookie-parser');
  const licenseRoutes = require('./routes/licenseRoutes');
  const licenseAuth = require('./middleware/licenseAuth');

  // Parse cookies and JSON before license logic
  app.use(cookieParser());
  app.use(express.json());

  // Expose license activation/creation endpoints before protection
  app.use('/license', licenseRoutes);

  // Exclude static assets and common public files from license checks
  const openPaths = [
    '/service-worker.js',
    '/manifest.json',
    '/favicon.ico',
    '/robots.txt'
  ];

  // Handle all other routes and run license check
  app.use((req, res, next) => {
    const receivedLicense = req.headers['x-license-key'] || req.cookies?.license || 'none';
    console.log('[licenseIntegration] Received license:', receivedLicense);
    console.log('[licenseIntegration] Request path:', req.path);

    // Allow direct matches (manifest, service worker, etc.)
    if (openPaths.includes(req.path)) {
      console.log('[licenseIntegration] Open path, skipping license check');
      return next();
    }

    // Allow requests for static files
    if (req.path.startsWith('/assets/') || req.path.startsWith('/static/')) {
      console.log('[licenseIntegration] Static file path, skipping license check');
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
