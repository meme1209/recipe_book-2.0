module.exports = function integrateLicense(app, express) {
  const path = require('path');
  const cookieParser = require('cookie-parser');
  const licenseRoutes = require('./routes/licenseRoutes');
  const licenseAuth = require('./middleware/licenseAuth');
  console.log('Checking license key:', req.body.licenseKey);


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

  app.use((req, res, next) => {
    // Allow direct matches (manifest, service worker, etc.)
    if (openPaths.includes(req.path)) return next();

    // Allow requests for static files (like /assets/... or /static/...)
    if (req.path.startsWith('/assets/') || req.path.startsWith('/static/')) return next();

    // Otherwise, run the license check
    return licenseAuth(req, res, next);
  });
};
