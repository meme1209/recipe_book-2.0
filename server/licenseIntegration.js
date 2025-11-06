module.exports = function integrateLicense(app, express) {
  // Ensure these packages are installed: cookie-parser, express
  const cookieParser = require('cookie-parser');
  const licenseRoutes = require('./routes/licenseRoutes');
  const licenseAuth = require('./middleware/licenseAuth');

  // parse cookies and JSON before license logic
  app.use(cookieParser());
  app.use(express.json());

  // expose license activation/creation endpoints before protection
  app.use('/license', licenseRoutes);

  // protect everything after this middleware (index and static assets are allowed by the middleware itself)
  app.use(licenseAuth);
};
