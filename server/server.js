const express = require('express');
const path = require('path');

const app = express();

// -----------------------------------
// Middleware
// -----------------------------------

app.use(express.json());

// -----------------------------------
// Serve Static Files
// -----------------------------------

app.use('/api/ratings', require('./routes/ratingRoutes'));

app.use(express.static(path.join(__dirname, 'public')));

// -----------------------------------
// Main Route
// -----------------------------------

app.get('/', (req, res) => {

  res.sendFile(
    path.join(__dirname, 'public', 'index.html')
  );

});

// -----------------------------------
// Start Server
// -----------------------------------

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(`🚀 Server listening on port ${PORT}`);

});