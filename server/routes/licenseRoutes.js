// server/routes/recipeRoutes.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const licenseAuth = require('../middleware/licenseAuth');

// Paths
const RECIPES_DIR = path.join(__dirname, '..', '..', 'public', 'recipes');
const INDEX_PATH = path.join(__dirname, '..', '..', 'public', 'index.html');

// Ensure recipes directory exists
if (!fs.existsSync(RECIPES_DIR)) fs.mkdirSync(RECIPES_DIR, { recursive: true });

// --- ADD RECIPE (ADMIN ONLY) ---
router.post('/', licenseAuth, async (req, res) => {
  try {
    if (!req.license?.isAdmin)
      return res.status(403).json({ error: 'Admin only' });

    const { title, category, ingredients, instructions } = req.body;

    if (!title || !ingredients || !instructions)
      return res.status(400).json({ error: 'Missing fields' });

    // Generate recipe filename
    const fileName = title.toLowerCase().replace(/\s+/g, '-') + '.html';
    const filePath = path.join(RECIPES_DIR, fileName);

    // Build recipe HTML
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

    <h2>Ingredients</h2>
    <ul>${ingredients.map(i => `<li>${i}</li>`).join('')}</ul>

    <h2>Instructions</h2>
    <p>${instructions.replace(/\n/g, '<br>')}</p>

    <a href="/index.html">⬅ Back to Recipes</a>
  </div>
</body>
</html>`;

    fs.writeFileSync(filePath, html, 'utf8');

    // --- Update index.html ---
    let indexHTML = fs.readFileSync(INDEX_PATH, 'utf8');
    const categoryTitle = category.trim();

    // Regex to find the correct category <ul>
    const sectionRegex = new RegExp(
      `<h2>${categoryTitle}</h2>[\\s\\S]*?<ul>([\\s\\S]*?)</ul>`,
      'i'
    );

    const newRecipeLink = `        <li><a href="recipes/${fileName}">${title}</a></li>\n`;

    if (sectionRegex.test(indexHTML)) {
      // Category exists → insert inside that <ul>
      indexHTML = indexHTML.replace(sectionRegex, (match, ulContent) => {
        return match.replace(
          ulContent,
          ulContent.trim() + '\n' + newRecipeLink.trim()
        );
      });
    } else {
      // Category does NOT exist → create a new section
      const newSection = `
    <section>
      <h2>${categoryTitle}</h2>
      <ul>
${newRecipeLink.trim()}
      </ul>
    </section>
`;
      indexHTML = indexHTML.replace('</main>', newSection + '\n</main>');
    }

    fs.writeFileSync(INDEX_PATH, indexHTML, 'utf8');

    res.json({ ok: true, file: `/recipes/${fileName}` });
  } catch (err) {
    console.error('❌ Error creating recipe:', err);
    res.status(500).json({ error: 'Failed to create recipe' });
  }
});

// Get list of recipes
router.get('/', async (req, res) => {
  try {
    const files = fs.readdirSync(RECIPES_DIR).filter(f => f.endsWith('.html'));
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Could not list recipes' });
  }
});

module.exports = router;
