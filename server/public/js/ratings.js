(function () {

	'use strict';

	document.addEventListener(
		'DOMContentLoaded',
		function () {

			const recipeId =
				document.body?.dataset?.recipeId;

			if (!recipeId) return;

			const container =
				document.querySelector(
					'.recipe-rating'
				);

			if (!container) return;

			const localKey =
				'rated::' + recipeId;

			container.innerHTML = `
				<div class="rating-stars"></div>
				<div class="rating-info">
					Loading rating...
				</div>
			`;

			const starsDiv =
				container.querySelector(
					'.rating-stars'
				);

			const infoDiv =
				container.querySelector(
					'.rating-info'
				);

			let currentAverage = 0;

			// -------------------------
			// Draw stars
			// -------------------------

			function drawStars(active) {

				starsDiv.innerHTML = '';

				for (
					let i = 1;
					i <= 5;
					i++
				) {

					const star =
						document.createElement(
							'span'
						);

					star.textContent =
						i <= active
							? '★'
							: '☆';

					star.style.fontSize =
						'2rem';

					star.style.cursor =
						'pointer';

					star.style.userSelect =
						'none';

					// Hover preview

					star.addEventListener(
						'mouseenter',
						() => {

							previewStars(i);

						}
					);

					// Click submit

					star.addEventListener(
						'click',
						() => {

							submitRating(i);

						}
					);

					starsDiv.appendChild(
						star
					);

				}

			}

			// -------------------------
			// Hover preview
			// -------------------------

			function previewStars(
				active
			) {

				const stars =
					starsDiv.querySelectorAll(
						'span'
					);

				stars.forEach(
					(star, index) => {

						star.textContent =
							index < active
								? '★'
								: '☆';

					}
				);

			}

			// -------------------------
			// Reset after hover
			// -------------------------

			starsDiv.addEventListener(
				'mouseleave',
				() => {

					drawStars(
						Math.round(
							currentAverage
						)
					);

				}
			);

			// -------------------------
			// Load rating
			// -------------------------

			async function loadRating() {

				try {

					const res =
						await fetch(
							'/api/ratings/' +
							recipeId
						);

					const data =
						await res.json();

					currentAverage =
						data.average;

					drawStars(
						Math.round(
							data.average
						)
					);

					infoDiv.innerHTML = `
						${data.average.toFixed(1)} / 5.0
						<br>
						${data.count} ratings
					`;

				} catch (err) {

					console.error(err);

					infoDiv.textContent =
						'Failed to load ratings';

				}

			}

			// -------------------------
			// Submit rating
			// -------------------------

			async function submitRating(
				value
			) {

				console.log(
					'Submitting:',
					value
				);

				if (
					localStorage.getItem(
						localKey
					)
				) {

					alert(
						'You already rated this recipe.'
					);

					return;

				}

				try {

					const res =
						await fetch(
							'/api/ratings/' +
							recipeId,
							{
								method: 'POST',

								headers: {
									'Content-Type':
										'application/json'
								},

								body:
									JSON.stringify({
										rating:
											value
									})
							}
						);

					if (!res.ok) {

						throw new Error(
							'POST failed'
						);

					}

					localStorage.setItem(
						localKey,
						'true'
					);

					await loadRating();

				} catch (err) {

					console.error(err);

					alert(
						'Failed to submit rating'
					);

				}

			}

			// -------------------------
			// Start
			// -------------------------

			loadRating();

		}
	);

})();