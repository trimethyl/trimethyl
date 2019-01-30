/**
 * @module  animator
 * @author 	Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var Alloy = require('alloy');
var _ = require('alloy/underscore')._;
var Matrix = require('T/matrix');

/**
 * Animate a view from `A` to `B` properties. 
 * It puts the `A` properties before the animations starts, then it animates to `B`.
 * @param  {Ti.UI.View}   	view 						The view to animate
 * @param  {Object}   		a 							Initial state
 * @param  {Object}   		b        				Final state
 * @param  {Function} 		[callback=null] 		Callback to execute when animation ends
 */
exports.animateFromTo = function(view, a, b, callback) {
	callback = callback || Alloy.Globals.noop;
	view.applyProperties(a);
	_.defer(function(){
		view.animate(b, callback);
	});
};

/**
 * Fade in the view
 * @param {Object} 			opt
 * @param {Ti.UI.View} 		opt.view 					The view to animate
 * @param {Number} 			[opt.duration=400] 		The duration in ms
 * @param {Function} 		[opt.callback=null]		Callback to execute when animation ends
 */
exports.fadeIn = function(opt) {
	_.defaults(opt, {
		duration: 400
	});

	return exports.animateFromTo(opt.view,
	{ 
		opacity: 0 
	},
	{ 
		opacity: 1, 
		duration: opt.duration
	},
	opt.callback);
};

/**
 * Fade out the view
 * @param {Object} 			opt
 * @param {Ti.UI.View} 		opt.view 					The view to animate
 * @param {Number} 			[opt.duration=400] 		The duration in ms
 * @param {Function} 		[opt.callback=null]		Callback to execute when animation ends
 */
exports.fadeOut = function(opt) {
	_.defaults(opt, {
		duration: 400
	});

	return  exports.animateFromTo(opt.view,
	{ 
		opacity: 1 
	},
	{ 
		opacity: 0, 
		duration: opt.duration
	},
	opt.callback);
};

/**
 * Fade in the view applying a matrix transformation
 * @param {Object} 				opt
 * @param {Ti.UI.View} 			opt.view 					The view to animate
 * @param {Ti.UI.2DMatrix} 	opt.startTransform 		The initial matrix
 * @param {Ti.UI.2DMatrix}		opt.endTransform			The final matrix
 * @param {Number} 				[opt.duration=400] 		The duration in ms
 * @param {Function} 			[opt.callback=null]		Callback to execute when animation ends
 */
exports.fadeInWithTransform = function(opt) {
	_.defaults(opt, {
		duration: 400,
	});

	return exports.animateFromTo(opt.view,
	{ 
		opacity: 0, 
		transform: opt.startTransform
	},
	{ 
		opacity: 1, 
		transform: opt.endTransform,
		duration: opt.duration
	},
	opt.callback);
};

/**
 * Fade in the view with an offset from up
 * @param {Object} 			opt
 * @param {Ti.UI.View} 		opt.view 					The view to animate
 * @param {Number} 			[duration=400] 			The duration in ms
 * @param {Number} 			[opt.offset=50] 			The offset to apply when animation starts
 * @param {Function} 		[opt.callback=null]		Callback to execute when animation ends
 */
exports.fadeInUp = function(opt) {
	_.defaults(opt, {
		duration: 400,
		offset: 50
	});

	return exports.fadeInWithTransform({
		view: opt.view,
		startTransform: Matrix.i().t(0, -opt.offset).matrix,
		endTransform: Matrix.i().matrix,
		duration: opt.duration
	}, opt.callback);
};

/**
 * Fade in the view with an offset from left
 * @param {Object}			opt
 * @param {Ti.UI.View} 		opt.view 					The view to animate
 * @param {Number} 			[opt.duration=400] 		The duration in ms
 * @param {Number} 			[opt.offset=50] 			The offset to apply when animation starts
 * @param {Function} 		[opt.callback=null]		Callback to execute when animation ends
 */
exports.fadeInLeft = function(opt) {
	_.defaults(opt, {
		duration: 400,
		offset: 50
	});

	return exports.fadeInWithTransform({
		view: opt.view,
		startTransform: Matrix.i().t(-opt.offset, 0).matrix,
		endTransform: Matrix.i().matrix,
		duration: opt.duration
	}, opt.callback);
};

/**
 * Fade in the view with an offset from bottom
 * @param {Object}			opt
 * @param {Ti.UI.View} 		opt.view 					The view to animate
 * @param {Number} 			[opt.duration=400] 		The duration in ms
 * @param {Number} 			[opt.offset=50] 			The offset to apply when animation starts
 * @param {Function} 		[opt.callback=null]		Callback to execute when animation ends
 */
exports.fadeInBottom = function(opt) {
	_.defaults(opt, {
		duration: 400,
		offset: 50
	});

	return exports.fadeInWithTransform({
		view: opt.view,
		startTransform: Matrix.i().t(0, opt.offset).matrix,
		endTransform: Matrix.i().matrix,
		duration: opt.duration
	}, opt.callback);
};

/**
 * Fade in the view with an offset from right
 * @param {Object}			opt
 * @param {Ti.UI.View} 		opt.view 					The view to animate
 * @param {Number} 			[opt.duration=400] 		The duration in ms
 * @param {Number} 			[opt.offset=50] 			The offset to apply when animation starts
 * @param {Function} 		[opt.callback=null]		Callback to execute when animation ends
 */
exports.fadeInRight = function(opt) {
	_.defaults(opt, {
		duration: 400,
		offset: 50
	});

	return exports.fadeInWithTransform({
		view: opt.view,
		startTransform: Matrix.i().t(opt.offset, 0).matrix,
		endTransform: Matrix.i().matrix,
		duration: opt.duration
	}, opt.callback);
};

/**
 * Indefinitely move up and down a view
 * @param {Object} 				opt
 * @param {Ti.UI.View} 			opt.view 					The view to animate
 * @param {Number} 				[opt.duration=1000] 		The duration of the animation
 * @param {Number} 				[opt.y=10] 					How many pixel move up and down
 * @return {Function} 			A function that can be used to stop the animation calling its `stop()` method
 */
exports.upAndDown = function(opt) {
	var self = {};
	var run = true;

	// This is the return value, and it's a function
	// that simply set the internal flag `run` to false,
	// to stop the animation
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

		// Switch 1 to 0 and 0 to 1
		index = (index + 1) % 2;

		_.defer(function(){	
			var newY = index ? opt.y : 0;

			opt.view.animate({
				transform: Matrix.i().t(0, newY).matrix,
				duration: opt.duration
			}, loop);
		});
	})();

	return self;
};

/**
 * Treat the view to animate like a normal falling object
 * @param {Object} 				opt
 * @param {Ti.UI.View} 			opt.view 							The view to animate
 * @param {Number} 				[opt.friction=0.6] 				The friction to apply when the object touch the ground
 * @param {Number} 				[opt.potentialEnergy=10] 		The initial potential energy of the object
 * @param {Number} 				[opt.y=60] 							The initial height of the object
 * @param {Number}				[opt.gravity=9.81]				The world gravity
 * @param {Function} 			[opt.callback=null]				Callback to execute when animation ends
 * @return {Function} 			A function that can be used to stop the animation calling its `stop()` method
 */
exports.fallDownForGravity = function(opt) {
	var self = {};
	var run = true;
	var timeout = null;

	// This is the return value, and it's a function
	// that simply set the internal flag `run` to false and clear the timeout
	// to stop the animation
	self.stop = function() {
		clearTimeout(timeout);
		run = false;
	};

	_.defaults(opt, {
		friction: 0.6,
		potentialEnergy: 10,
		y: 60,
		gravity: 9.81,
		callback: Alloy.Globals.noop
	});

	// Initial potential energy
	var U = Number(opt.potentialEnergy);

	// Calculate the animation duration based on the gravity
	var animationDuration = 1000 * (2 / opt.gravity);
	
	// Index var represents how many time the object reached the floor
	var index = -1;
	var y = null;

	(function loop() {
		if (run === false) return;

		// If our potential energy is zero, stop everything
		if (U === 0) {
			opt.callback();
			return;
		}

		_.defer(function() {
			index++;

			if (index % 2 === 1) {
				U =  Math.floor( U - (U * opt.friction) );
				y = opt.y - ((U / opt.potentialEnergy) * opt.y);
			} else {
				y = opt.y;
			}

			// If we are contrasting the gravity, ease-in. Out otherwise
			var curve = Titanium.UI[ "ANIMATION_CURVE_EASE_" + (index % 2 === 0 ? "IN" : "OUT") ];
			
			opt.view.animate({
				duration: animationDuration,
				curve: curve,
				transform: Matrix.i().t(0, y).matrix
			}, loop);

		});
	})();

	return self;
};
