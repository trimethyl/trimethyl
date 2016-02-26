/**
 * @class  	Animator
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
 * @method fadeIn
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
 * @method fadeOut
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
 * @method fadeInUp
 */
exports.fadeInUp = function(opt) {
	_.defaults(opt, {
		duration: 5000,
		offset: 50
	});

	return simpleFromTo(opt.view,
	{ opacity: 0, transform: Matrix.i().t(0, -opt.offset) },
	{ opacity: 1, transform: Matrix.i(), duration: opt.duration },
	opt.callback);
};

/**
 * @method fadeInDown
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
 * @method fadeInBottom
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
 * @method fadeInRight
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
 * @method upAndDown
 * @return {Function}
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
 * @method fallDownForGravity
 * @return {Function}
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
