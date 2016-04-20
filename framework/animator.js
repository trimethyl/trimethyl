/**
 * @module  animator
 * @author 	Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var Matrix = require('T/matrix');

function simpleFromTo(view, a, b, callback) {
	callback = callback || Alloy.Globals.noop;
	view.applyProperties(a);
	_.defer(function(){
		view.animate(b, callback);
	});
}

/**
 * Fade in the view
 * @param {Object} opt
 * @param {Ti.UI.View} opt.view The view to animate
 * @param {Number} [duration=400] The duration in ms
 * @param {Function} callback
 */
exports.fadeIn = function(opt) {
	_.defaults(opt, {
		duration: 400
	});

	return simpleFromTo(opt.view,
	{ opacity: 0 },
	{ opacity: 1, duration: opt.duration },
	opt.callback);
};

/**
 * Fade out the view
 * @param {Object} opt
 * @param {Ti.UI.View} opt.view The view to animate
 * @param {Number} [duration=400] The duration in ms
 * @param {Function} callback
 */
exports.fadeOut = function(opt) {
	_.defaults(opt, {
		duration: 400
	});

	return  simpleFromTo(opt.view,
	{ opacity: 1 },
	{ opacity: 0, duration: opt.duration },
	opt.callback);
};

/**
 * Fade in the view with an offset from up
 * @param {Object} opt
 * @param {Ti.UI.View} opt.view The view to animate
 * @param {Number} [duration=400] The duration in ms
 * @param {Number} [offset=50] The offset to apply when animation starts
 * @param {Function} callback
 */
exports.fadeInUp = function(opt) {
	_.defaults(opt, {
		duration: 400,
		offset: 50
	});

	return simpleFromTo(opt.view,
	{ opacity: 0, transform: Matrix.i().t(0, -opt.offset) },
	{ opacity: 1, transform: Matrix.i(), duration: opt.duration },
	opt.callback);
};

/**
 * Fade in the view with an offset from left
 * @param {Object} opt
 * @param {Ti.UI.View} opt.view The view to animate
 * @param {Number} [duration=400] The duration in ms
 * @param {Number} [offset=50] The offset to apply when animation starts
 * @param {Function} callback
 */
exports.fadeInLeft = function(opt) {
	_.defaults(opt, {
		duration: 400,
		offset: 50
	});

	return simpleFromTo(opt.view,
	{ opacity: 0, transform: Matrix.i().t(-opt.offset, 0).matrix },
	{ opacity: 1, transform: Matrix.i().matrix, duration: opt.duration },
	opt.callback);
};

/**
 * Fade in the view with an offset from bottom
 * @param {Object} opt
 * @param {Ti.UI.View} opt.view The view to animate
 * @param {Number} [duration=400] The duration in ms
 * @param {Number} [offset=50] The offset to apply when animation starts
 * @param {Function} callback
 */
exports.fadeInBottom = function(opt) {
	_.defaults(opt, {
		duration: 400,
		offset: 50
	});

	return simpleFromTo(opt.view,
	{ opacity: 0, transform: Matrix.i().t(0, opt.offset).matrix },
	{ opacity: 1, transform: Matrix.i().matrix, duration: opt.duration },
	opt.callback);
};

/**
 * Fade in the view with an offset from right
 * @param {Object} opt
 * @param {Ti.UI.View} opt.view The view to animate
 * @param {Number} [duration=400] The duration in ms
 * @param {Number} [offset=50] The offset to apply when animation starts
 * @param {Function} callback
 */
exports.fadeInRight = function(opt) {
	_.defaults(opt, {
		duration: 400,
		offset: 50
	});

	return simpleFromTo(opt.view,
	{ opacity: 0, transform: Matrix.i().t(opt.offset, 0).matrix },
	{ opacity: 1, transform: Matrix.i().matrix, duration: opt.duration },
	opt.callback);
};

/**
 * Indefinitely move up and down a view
 * @param {Object} opt
 * @param {Ti.UI.View} opt.view The view to animate
 * @param {Number} [duration=1000] The duration of the animation
 * @param {Number} [y=10] How many pixel move up and down
 * @return {Function} A function that can be used to stop the animation calling its `stop()` method
 */
exports.upAndDown = function(opt) {
	var self = {};
	var run = true;

	self.stop = function() {
		run = false;
	};

	_.defaults(opt, {
		duration: 1000,
		y: 10
	});

	var index = 0;
	(function loop() {
		if (run === false) return;

		index = (index+1) % 2;
		_.defer(function(){
			opt.view.animate({
				transform: Matrix.i().t(0, index ? opt.y : 0).matrix,
				duration: opt.duration
			}, loop);
		});
	})();

	return self;
};

/**
 * Treat the view to animate like a normal falling object
 * @param {Object} opt
 * @param {Ti.UI.View} opt.view The view to animate
 * @param {Number} [friction=0.6] The friction to apply when the object touch the ground
 * @param {Number} [potentialEnergy=10] The initial potential energy of the object
 * @param {Number} [y=60] The initial height of the object
 * @param {Function} [callback=null]
 * @return {Function} A function that can be used to stop the animation calling its `stop()` method
 */
exports.fallDownForGravity = function(opt) {
	var self = {};
	var run = true;
	var timeout = null;

	self.stop = function() {
		clearTimeout(timeout);
		run = false;
	};

	_.defaults(opt, {
		friction: 0.6,
		potentialEnergy: 10,
		y: 60,
		callback: function(){}
	});

	var U = Number(opt.potentialEnergy);
	var index = -1;
	var y = null;

	(function loop() {
		if (run === false) return;

		index++;
		if (U === 0 && index % 2 === 0) {
			opt.callback();
			return;
		}

		_.defer(function() {
			if (index % 2 === 1) {
				U =  Math.floor( U - (U * opt.friction) );
				y = opt.y - ((U / opt.potentialEnergy) * opt.y);
			} else {
				y = opt.y;
			}
			timeout = setTimeout(loop, 250);
			opt.view.animate({
				duration: 250,
				curve: Titanium.UI[ "ANIMATION_CURVE_EASE_" + (index % 2 === 0 ? "IN" : "OUT") ],
				transform: Matrix.i().t(0, y).matrix
			});
		});
	})();

	return self;
};
