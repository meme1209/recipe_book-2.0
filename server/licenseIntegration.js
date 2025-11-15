const cookieParser = require('cookie-parser');
const licenseRoutes = require('./routes/licenseRoutes');
const licenseAuth = require('./middleware/licenseAuth');

module.exports = function integrateLicense(app, express) {

  app.use(cookieParser());
  app.use(express.json());

  // 1️⃣ License activation + verify API
  app.use('/license', licenseRoutes);

  // 2️⃣ Allowed without license
  const OPEN = [
    '/license.html',
    '/license/activate',
    '/license/verify',
    '/license/remove',
  ];

  app.use((req, res, next) => {
    const p = req.path;
    console.log('[LicenseIntegration] Checking path:', p);

    // --- Allow OPEN routes
    if (OPEN.includes(p)) return next();

    // --- Allow static assets required for license.html
    if (
      p.startsWith('/css/') ||
      p.startsWith('/js/') ||
      p.startsWith('/images/') ||
      p.endsWith('.css') ||
      p.endsWith('.js') ||
      p.endsWith('.png') ||
      p.endsWith('.jpg') ||
      p.endsWith('.jpeg') ||
      p.endsWith('.svg')
    ) {
      return next();
    }

    // --- Everything else requires license
    return licenseAuth(req, res, next);
  });
};
