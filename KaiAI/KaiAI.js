window.addEventListener('load', function() {
	var engine = window.TTTEngine;

	/*

	 x = opponent / self tic or toe
	 * = empty, placeable
	 - = empty, not placeable

	 */

	/**
	 * Defines a shape.
	 *
	 * @class Shape
	 */
	function Shape() {
		this.score = 0;
		this.objects = [];
	}

	// Define this AI.
	var ai = {
		/**
		 * @type Shape[]
		 */
		shapes: [],

		/**
		 * Runs the AI engine. Currently inefficient.
		 *
		 * @param {Function} callback
		 */
		run: function(callback) {
			var me = this;

			var highestX = engine.boardWidth / engine.boardCellSize;
			var highestY = engine.boardHeight / engine.boardCellSize;

			var randomX = Math.floor(Math.random() * highestX);
			var randomY = Math.floor(Math.random() * highestY);

			// Fetch shapes.
			var xhr = new XMLHttpRequest();
			xhr.open('GET', 'KaiAI/Shapes', false);
			xhr.send(null);

			// Parse shape format into an object.
			var shapesText = xhr.responseText;
			var parts = shapesText.split('=== Score: ');
			parts.forEach(function(part) {
				// Skip if it's empty.
				if (part !== '') {
					var dataParts = part.split(' ===');
					var score = parseInt(dataParts[0], 10);
					var shapeText = dataParts[1].replace(/\s+/, '');
					shapeText = shapeText.replace(/(\r\n|\r|\n)$/, ''); // Remove last line break if it exists.

					var lines = shapeText.split(/(\r\n|\r|\n)/);

					shape = new Shape();
					shape.score = score;

					var y = 0;
					for (var i = 0, length = lines.length; i < length; i += 2) { // +2 because there are also \n items which we want to skip...
						var line = lines[i];

						for (var x = 0, chars = line.length; x < chars; x++) {
							if (line[x] !== ' ') {
								shape.objects.push({
									x: x,
									y: y,
									type: line[x]
								});
							}
						}

						y++;
					}

					me.shapes.push(shape);
				}
			});

			// Create rotated and mirrored versions as well, because we don't want to manually do those transforms in the shapes file.
			// TODO

			// Create scoreboard. An array of objects {x: 0, y: 0, score: 50}.
			var scoreboard = [];

			// Loop through the game area and mark scores.
			for (var x = 0; x < highestX; x++) {
				for (var y = 0; y < highestY; y++) {
					for (var i = 0, l = this.shapes.length; i < l; i++) {
						var shape = this.shapes[i];

						// Check if the shape was found at [x, y] coordinate.
						if (this.checkShape(x, y, shape)) {
							scoreboard.push({
								x: x,
								y: y,
								score: shape.score
							});
						}
					}
				}
			}

			// Determine the highest score.
			var highestScore = 0;
			scoreboard.forEach(function(item) {
				if (item.score > highestScore) {
					highestScore = item.score;
				}
			});

			// Make an array of all highest scored items.
			var highestScoredItems = [];
			scoreboard.forEach(function(item) {
				if (item.score === highestScore) {
					highestScoredItems.push(item);
				}
			});

			// Choose a random item.
			if (highestScoredItems.length) {
				var item = highestScoredItems[Math.floor(Math.random() * highestScoredItems.length)];
				callback([item.x, item.y]);
			} else {
				callback([randomX, randomY]);
			}
		},

		/**
		 * Checks if the shape can be found at given location.
		 *
		 * @param {Number} x
		 * @param {Number} y
		 * @param {Shape} shape
		 */
		checkShape: function(x, y, shape) {
			var matches = 0;

			shape.objects.forEach(function(shapeObject) {
				var gameObject = engine.getGameObject(x + shapeObject.x, y + shapeObject.y);

				// Matched empty "*" or "-".
				if ((shapeObject.type === '*' || shapeObject.type === '-') && gameObject === null) {
					matches++;
				}

				// Matched "X". TODO: We should do two loops, one for tic and one for toe. This OR check is bad!
				if (shapeObject.type === 'X' && gameObject && (gameObject.type === 0 || gameObject.type === 1)) {
					matches++;
				}
			});

			// Return true if all shape objects matched, and match count > 0.
			return (matches && shape.objects.length === matches);
		}
	};

	engine.addAI('KaiAI', ai.run, ai);
}, false);