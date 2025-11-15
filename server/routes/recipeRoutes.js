// server/routes/recipeRoutes.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const licenseAuth = require('../middleware/licenseAuth');

// ✅ Folder where new recipes will be saved as HTML
const RECIPES_DIR = path.join(__dirname, '..', 'public', 'recipes');
const INDEX_PATH = path.join(__dirname, '..', 'public', 'index.html');

// --- Ensure recipes directory exists ---
if (!fs.existsSync(RECIPES_DIR)) fs.mkdirSync(RECIPES_DIR, { recursive: true });

// --- Add new recipe (Admins only) ---
router.post('/', licenseAuth, async (req, res) => {
  try {
    if (!req.license?.isAdmin)
      return res.status(403).json({ error: 'Admin only' });

    const { title, category, ingredients, instructions } = req.body;
    if (!title || !ingredients || !instructions)
      return res.status(400).json({ error: 'Missing fields' });

    // Create HTML file for recipe
    const fileName = title.toLowerCase().replace(/\s+/g, '-') + '.html';
    const filePath = path.join(RECIPES_DIR, fileName);

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <div class="recipe-container">
    <h1>${title}</h1>
    <h3>Category: ${category}</h3>
    <h2>Ingredients</h2>
    <ul>${ingredients.split('\n').map(i => `<li>${i.trim()}</li>`).join('')}</ul>
    <h2>Instructions</h2>
    <p>${instructions.replace(/\n/g, '<br>')}</p>
    <a href="/index.html">⬅ Back to Recipes</a>
  </div>
</body>
</html>`;

    fs.writeFileSync(filePath, html, 'utf8');

    // --- Insert into index.html automatically ---
    let index = fs.readFileSync(INDEX_PATH, 'utf8');
    const newLink = `<a href="/recipes/${fileName}">${title}</a>`;

    if (!index.includes(newLink)) {
      index = index.replace(
        '</body>',
        `<div class="recipe-link">${newLink}</div>\n</body>`
      );
      fs.writeFileSync(INDEX_PATH, index, 'utf8');
    }

    console.log(`✅ Recipe "${title}" added successfully`);
    res.json({ ok: true, file: `/recipes/${fileName}` });

  } catch (err) {
    console.error('❌ Error creating recipe:', err);
    res.status(500).json({ error: 'Failed to create recipe' });
  }
});

// --- Get list of recipes (for future use) ---
router.get('/', async (req, res) => {
  try {
    const files = fs.readdirSync(RECIPES_DIR).filter(f => f.endsWith('.html'));
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Could not list recipes' });
  }
});

// DELETE /api/recipes/:slug  (it will remove the file and remove the index link)
router.delete('/:slug', licenseAuth, (req, res) => {
  try {
    if (!req.license?.isAdmin) return res.status(403).json({ error: 'Admin only' });

    const slug = req.params.slug;
    const fileName = slug.endsWith('.html') ? slug : `${slug}.html`;
    const filePath = path.join(RECIPES_DIR, fileName);

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // remove link from index.html: remove occurrences of href="/recipes/<fileName>"
    let indexHtml = fs.readFileSync(INDEX_PATH, 'utf8');
    const regex = new RegExp(`<a[^>]*href=["']?/recipes/${fileName}["'][^>]*>.*?<\\/a>\\s*`, 'gi');
    indexHtml = indexHtml.replace(regex, '');
    fs.writeFileSync(INDEX_PATH, indexHtml, 'utf8');

    return res.json({ ok: true });
  } catch (err) {
    console.error('Error deleting recipe:', err);
    return res.status(500).json({ error: 'Failed to delete' });
  }
});

module.exports = router;
