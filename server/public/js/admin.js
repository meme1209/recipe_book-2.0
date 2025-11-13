async function fetchRecipes() {
  const res = await fetch('/api/recipes');
  return res.json();
}

async function renderRecipes() {
  const list = document.getElementById('recipeList');
  list.innerHTML = '';
  const recipes = await fetchRecipes();

  recipes.forEach(r => {
    const li = document.createElement('li');
    li.textContent = `${r.title} (${r.type})`;
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.onclick = async () => {
      if (!confirm(`Delete ${r.title}?`)) return;
      await fetch(`/api/recipes/${r.id}`, { method: 'DELETE' });
      renderRecipes();
    };
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

document.getElementById('addForm').addEventListener('submit', async e => {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const type = document.getElementById('type').value.trim();
  const ingredients = document.getElementById('ingredients').value.trim();
  const instructions = document.getElementById('instructions').value.trim();

  const res = await fetch('/api/recipes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, type, ingredients, instructions })
  });

  const data = await res.json();
  alert(data.message || 'Done');
  e.target.reset();
  renderRecipes();
});

renderRecipes();
