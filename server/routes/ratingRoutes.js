const express = require('express');

const fs = require('fs');

const path = require('path');

const router = express.Router();

const ratingsPath = path.join(
	__dirname,
	'..',
	'data',
	'ratings.json'
);

// ------------------------------------
// Load ratings
// ------------------------------------

function loadRatings() {

	try {

		const data = fs.readFileSync(
			ratingsPath,
			'utf8'
		);

		return JSON.parse(data);

	} catch (err) {

		return {};

	}

}

// ------------------------------------
// Save ratings
// ------------------------------------

function saveRatings(data) {

	fs.writeFileSync(
		ratingsPath,
		JSON.stringify(data, null, 2)
	);

}

// ------------------------------------
// GET rating
// ------------------------------------

router.get('/:recipeId', (req, res) => {

	const recipeId = req.params.recipeId;

	const ratings = loadRatings();

	const recipe =
		ratings[recipeId] || {
			total: 0,
			count: 0
		};

	const average =
		recipe.count > 0
			? recipe.total / recipe.count
			: 0;

	res.json({
		average: Number(
			average.toFixed(1)
		),
		count: recipe.count
	});

});

// ------------------------------------
// POST rating
// ------------------------------------

router.post('/:recipeId', (req, res) => {

    console.log('POST HIT');

	const recipeId = req.params.recipeId;

	const rating = Number(req.body.rating);

	if (
		!rating ||
		rating < 1 ||
		rating > 5
	) {

		return res.status(400).json({
			error: 'Invalid rating'
		});

	}

	const ratings = loadRatings();

	if (!ratings[recipeId]) {

		ratings[recipeId] = {
			total: 0,
			count: 0
		};

	}

	ratings[recipeId].total += rating;

	ratings[recipeId].count += 1;

	saveRatings(ratings);

	const average =
		ratings[recipeId].total /
		ratings[recipeId].count;

	res.json({
		average: Number(
			average.toFixed(1)
		),
		count: ratings[recipeId].count
	});

});

module.exports = router;