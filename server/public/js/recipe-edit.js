// Advanced Recipe Editor
// Stable Version

(function () {

	'use strict';

	document.addEventListener('DOMContentLoaded', function () {

		const root = document.body;

		const recipeId = root?.dataset?.recipeId;

		if (!recipeId) return;

		const storageKey = 'recipe::' + recipeId;

		const title = document.querySelector('.recipe-title');

		const header = document.querySelector('header');

		const footer = document.querySelector('footer');

		if (!title || !header || !footer) return;

		// -----------------------------------------
		// Create editable wrapper
		// -----------------------------------------

		let editorArea = document.querySelector('.recipe-editor-area');

		if (!editorArea) {

			editorArea = document.createElement('div');

			editorArea.className = 'recipe-editor-area';

			const sections = document.querySelectorAll('section');

			sections.forEach(section => {

				editorArea.appendChild(section);

			});

			footer.before(editorArea);

		}

		// -----------------------------------------
		// Save original
		// -----------------------------------------

		if (!editorArea.dataset.original) {

			editorArea.dataset.original =
				editorArea.innerHTML;

		}

		// -----------------------------------------
		// Restore saved
		// -----------------------------------------

		(function loadSaved() {

			try {

				const raw = localStorage.getItem(storageKey);

				if (!raw) return;

				const obj = JSON.parse(raw);

				if (obj.html) {

					editorArea.innerHTML = obj.html;

				}

			} catch (e) {}

		})();

		// -----------------------------------------
		// Toolbar
		// -----------------------------------------

		const toolbar = document.createElement('div');

		toolbar.className = 'recipe-editor-toolbar';

		toolbar.style.cssText =
			'margin-top:.75rem; display:flex; gap:.5rem; flex-wrap:wrap;';

		toolbar.innerHTML = `
			<button class="edit-btn" type="button">Edit</button>
			<button class="save-btn" type="button" style="display:none">Save</button>
			<button class="cancel-btn" type="button" style="display:none">Cancel</button>
			<button class="reset-btn" type="button">Reset</button>
			<button class="add-section-btn" type="button" style="display:none">
				Add Section
			</button>
		`;

		header.appendChild(toolbar);

		const editBtn = toolbar.querySelector('.edit-btn');

		const saveBtn = toolbar.querySelector('.save-btn');

		const cancelBtn = toolbar.querySelector('.cancel-btn');

		const resetBtn = toolbar.querySelector('.reset-btn');

		const addSectionBtn =
			toolbar.querySelector('.add-section-btn');

		let backupHtml = null;

		// -----------------------------------------
		// Editable mode
		// -----------------------------------------

		function setEditable(on) {

			const editableElements =
				editorArea.querySelectorAll(
					'h2, h3, p, li'
				);

			editableElements.forEach(el => {

				el.contentEditable =
					on ? 'true' : 'false';

				el.style.outline =
					on ? '1px dashed #999' : '';

			});

			document.querySelectorAll(
				'.section-delete-btn'
			).forEach(btn => btn.remove());

			if (on) {

				editorArea.querySelectorAll(
					'section'
				).forEach(section => {

					const btn =
						document.createElement('button');

					btn.type = 'button';

					btn.textContent =
						'Delete Section';

					btn.className =
						'section-delete-btn';

					btn.style.cssText =
						'margin-bottom:.5rem; display:block;';

					btn.addEventListener(
						'click',
						function () {

							if (
								confirm(
									'Delete this section?'
								)
							) {

								section.remove();

							}

						}
					);

					section.prepend(btn);

				});

			}

		}

		// -----------------------------------------
		// Add Section
		// -----------------------------------------

		function addSection() {

			const sectionTitle = prompt(
				'Section title:',
				'Notes'
			);

			if (!sectionTitle) return;

			const sectionType = prompt(
				'Type "list" or "steps"',
				'list'
			);

			const section =
				document.createElement('section');

			let content = `
				<h2>${sectionTitle}</h2>
			`;

			if (
				sectionType &&
				sectionType.toLowerCase() === 'steps'
			) {

				content += `
					<ol class="recipe-instructions">
						<li>New step</li>
					</ol>
				`;

			} else {

				content += `
					<ul class="recipe-ingredients">
						<li>New item</li>
					</ul>
				`;

			}

			section.innerHTML = content;

			editorArea.appendChild(section);

			setEditable(true);

		}

		// -----------------------------------------
		// Edit
		// -----------------------------------------

		editBtn.addEventListener(
			'click',
			function () {

				backupHtml =
					editorArea.innerHTML;

				setEditable(true);

				editBtn.style.display =
					'none';

				saveBtn.style.display =
					'inline-block';

				cancelBtn.style.display =
					'inline-block';

				addSectionBtn.style.display =
					'inline-block';

			}
		);

		// -----------------------------------------
		// Save
		// -----------------------------------------

		saveBtn.addEventListener(
			'click',
			function () {

				try {

					localStorage.setItem(
						storageKey,
						JSON.stringify({
							html:
								editorArea.innerHTML,
							savedAt: Date.now()
						})
					);

				} catch (e) {}

				setEditable(false);

				editBtn.style.display =
					'inline-block';

				saveBtn.style.display =
					'none';

				cancelBtn.style.display =
					'none';

				addSectionBtn.style.display =
					'none';

			}
		);

		// -----------------------------------------
		// Cancel
		// -----------------------------------------

		cancelBtn.addEventListener(
			'click',
			function () {

				if (backupHtml) {

					editorArea.innerHTML =
						backupHtml;

				}

				setEditable(false);

				editBtn.style.display =
					'inline-block';

				saveBtn.style.display =
					'none';

				cancelBtn.style.display =
					'none';

				addSectionBtn.style.display =
					'none';

			}
		);

		// -----------------------------------------
		// Reset
		// -----------------------------------------

		resetBtn.addEventListener(
			'click',
			function () {

				if (
					!confirm(
						'Reset recipe to original?'
					)
				) {
					return;
				}

				localStorage.removeItem(
					storageKey
				);

				editorArea.innerHTML =
					editorArea.dataset.original;

				setEditable(false);

			}
		);

		// -----------------------------------------
		// Add Section Button
		// -----------------------------------------

		addSectionBtn.addEventListener(
			'click',
			addSection
		);

	});

})();