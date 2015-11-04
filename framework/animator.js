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

exports.start = function(opt, renderer) {
	return renderer(opt);
};

exports.stop = function(renderer) {
	renderer.run = false;
	if (_.isFunction(renderer.destroy)) {
		renderer.destroy();
	}
};