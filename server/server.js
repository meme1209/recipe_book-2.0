const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

// --- Middleware ---
app.use(express.json());
app.use(cookieParser());

// --- Connect to MongoDB ---
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// --- Serve static assets FIRST ---
app.use(express.static(path.join(__dirname, 'public')));

// --- Recipe API routes ---
app.use('/api/recipes', require('./routes/recipeRoutes'));

// --- Integrate license logic (AFTER static files) ---
const integrateLicense = require('./licenseIntegration');
integrateLicense(app, express);

// --- Admin route ---
const License = require('./models/License');
app.get('/admin', async (req, res) => {
  try {
    const licenseKey = req.cookies?.licenseKey;
    if (!licenseKey) {
      return res.status(403).send('License required');
    }

    const license = await License.findOne({ key: licenseKey });
    if (!license) {
      return res.status(403).send('Invalid license');
    }

    if (!license.isAdmin) {
      return res.status(403).send('Access denied: Admin license required');
    }

    // ✅ Serve the admin homepage
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  } catch (err) {
    console.error('Error checking admin license:', err);
    res.status(500).send('Server error');
  }
});

// --- Simple index route ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
