const express = require('express');
const path = require('path');

const app = express();

// integrate license logic (uses cookie-parser and JSON parsing internally)
const integrateLicense = require('./licenseIntegration');
integrateLicense(app, express);

// serve static assets (adjust path if your client files live elsewhere)
app.use(express.static(path.join(__dirname, '..', 'public')));

// simple index route (optional)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});