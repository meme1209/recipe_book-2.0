// Shared per-recipe editor: saves edits to localStorage per-device using a recipe id.
(function () {
	'use strict';
	document.addEventListener('DOMContentLoaded', function () {
		var root = document.body;
		var id = root && root.dataset && root.dataset.recipeId;
		if (!id) return;

		var title = document.querySelector('.recipe-title');
		var ingredientsLists = document.querySelectorAll('.recipe-ingredients');
		var instr = document.querySelector('.recipe-instructions');

		// If there's no title, no ingredients, or no instructions, stop
		if (!title || ingredientsLists.length === 0 || !instr) return;

		// Just use the first ingredients section as the editable target
		var ing = ingredientsLists[0];

		// Optionally merge all ingredients into one array (not strictly needed for editing)
		var allIngredients = [];
		ingredientsLists.forEach(list => {
			list.querySelectorAll('li').forEach(li => {
				allIngredients.push(li.textContent.trim());
			});
		});

		// Preserve originals on first load to allow reset
		if (!title.dataset.original) title.dataset.original = title.innerHTML;
		if (!ing.dataset.original) ing.dataset.original = ing.innerHTML;
		if (!instr.dataset.original) instr.dataset.original = instr.innerHTML;

		var key = 'recipe::' + id;

		// Restore saved copy if present
		(function loadSaved() {
			try {
				var raw = localStorage.getItem(key);
				if (!raw) return;
				var obj = JSON.parse(raw);
				if (obj.title) title.innerHTML = obj.title;
				if (obj.ingredients) ing.innerHTML = obj.ingredients;
				if (obj.instructions) instr.innerHTML = obj.instructions;
			} catch (e) { /* ignore parse errors/quota errors */ }
		})();

		// Inject toolbar
		var header = document.querySelector('header') || root;
		var toolbar = document.createElement('div');
		toolbar.className = 'recipe-editor';
		toolbar.style.cssText = 'margin-top:.5rem; font-size:0.95rem;';
		toolbar.innerHTML =
			'<button class="edit-btn" type="button">Edit</button> ' +
			'<button class="save-btn" type="button" style="display:none">Save</button> ' +
			'<button class="cancel-btn" type="button" style="display:none">Cancel</button> ' +
			'<button class="reset-btn" type="button">Reset</button>';
		header.appendChild(toolbar);

		var editBtn = toolbar.querySelector('.edit-btn');
		var saveBtn = toolbar.querySelector('.save-btn');
		var cancelBtn = toolbar.querySelector('.cancel-btn');
		var resetBtn = toolbar.querySelector('.reset-btn');

		var backup = null;
		function setEditable(on) {
			[title, ing, instr].forEach(function (el) {
				el.contentEditable = on ? 'true' : 'false';
				el.style.outline = on ? '1px dashed #999' : '';
				if (!on) el.removeAttribute('spellcheck');
			});
		}

		editBtn.addEventListener('click', function () {
			backup = {
				title: title.innerHTML,
				ingredients: ing.innerHTML,
				instructions: instr.innerHTML
			};
			setEditable(true);
			editBtn.style.display = 'none';
			saveBtn.style.display = 'inline-block';
			cancelBtn.style.display = 'inline-block';
			title.focus();
			if (window.getSelection && document.createRange) {
				var range = document.createRange();
				range.selectNodeContents(title);
				range.collapse(false);
				var sel = window.getSelection();
				sel.removeAllRanges();
				sel.addRange(range);
			}
		});

		saveBtn.addEventListener('click', function () {
			var obj = {
				title: title.innerHTML,
				ingredients: ing.innerHTML,
				instructions: instr.innerHTML,
				savedAt: Date.now()
			};
			try {
				localStorage.setItem(key, JSON.stringify(obj));
			} catch (e) { /* ignore quota errors */ }
			setEditable(false);
			editBtn.style.display = 'inline-block';
			saveBtn.style.display = 'none';
			cancelBtn.style.display = 'none';
		});

		cancelBtn.addEventListener('click', function () {
			if (backup) {
				title.innerHTML = backup.title;
				ing.innerHTML = backup.ingredients;
				instr.innerHTML = backup.instructions;
			}
			setEditable(false);
			editBtn.style.display = 'inline-block';
			saveBtn.style.display = 'none';
			cancelBtn.style.display = 'none';
		});

		resetBtn.addEventListener('click', function () {
			if (!confirm('Reset to original recipe? This clears your saved copy on this device.')) return;
			localStorage.removeItem(key);
			title.innerHTML = title.dataset.original;
			ing.innerHTML = ing.dataset.original;
			instr.innerHTML = instr.dataset.original;
			setEditable(false);
			editBtn.style.display = 'inline-block';
			saveBtn.style.display = 'none';
			cancelBtn.style.display = 'none';
		});
	});
})();
