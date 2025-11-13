const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const licenseAuth = require('../middleware/licenseAuth');

// --- Create a new recipe (admin only) ---
router.post('/', licenseAuth, async (req, res) => {
  if (!req.license || !req.license.isAdmin)
    return res.status(403).json({ error: 'Admin only' });

  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Missing fields' });

  const recipe = new Recipe({ title, content, createdAt: new Date() });
  await recipe.save();
  res.json(recipe);
});

// --- Get all recipes ---
router.get('/', async (req, res) => {
  const recipes = await Recipe.find().sort({ createdAt: -1 });
  res.json(recipes);
});

module.exports = router;
