/**
 * @class  	Animator
 * @author 	Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

exports.UP_AND_DOWN = function(opt) {
	var self = {};
	self.run = true;

	_.defaults(opt, {
		duration: 1000,
		y: 10
	});

	var index = 0;
	(function loop() {
		if (self.run === false) return;

		index = (index+1) % 2;
		opt.view.animate({
			transform: Ti.UI.create2DMatrix().translate(0, index ? opt.y : 0),
			duration: opt.duration
		}, loop);
	})();

	return self;
};

exports.FADE_IN = function(opt) {
	_.defaults(opt, {
		duration: 400
	});

	opt.view.opacity = 0;
	opt.view.animate({
		opacity: 1,
		duration: opt.duration
	}, function() {
		if (_.isFunction(opt.callback)) opt.callback();
	});
};

exports.FADE_OUT = function(opt) {
	_.defaults(opt, {
		duration: 400
	});

	opt.view.opacity = 1;
	opt.view.animate({
		opacity: 0,
		duration: opt.duration
	}, function() {
		if (_.isFunction(opt.callback)) opt.callback();
	});
};


/**
 * @method start
 * @param  {Object} opt Options
 * @param  {Object} renderer An constant of Animator
 * @return {Object} An instance of renderer
 */
exports.start = function(opt, renderer) {
	return renderer(opt);
};

/**
 * @method stop
 * @param  {Object} renderInstance
 */
exports.stop = function(renderInstance) {
	renderInstance.run = false;
	if (_.isFunction(renderInstance.destroy)) {
		renderInstance.destroy();
	}
};