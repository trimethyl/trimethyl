var currentImage;
var self = {};

exports.createView = function(args){
	args = args || {};
	self.width = args.width || require('util').getScreenWidth();
	self.height = args.height || require('util').getScreenHeight();
	self.duration = args.duration || 2000;
	self.timeout = args.timeout || 0;
	self.images = JSON.parse(args.images) || [];
	self.pointer = 0;

	var slideshowView = Ti.UI.createView({
		width: self.width,
		height: self.height
	});

	var buffer1Image = Ti.UI.createImageView({
		zIndex: 1000,
		opacity: 0.0
	});
	slideshowView.add(buffer1Image);

	var buffer2Image = Ti.UI.createImageView({
		zIndex: 999,
		opacity: 0.0
	});
	slideshowView.add(buffer2Image);

	currentImage = buffer1Image;

	var kenBurns = function(){
		if (self.pointer >= self.images.length) {
			// self.images.shuffle();
			self.pointer = 0;
		}

		currentImage.setImage(self.images[self.pointer]);

		var scaleFrom = (slideshowView.width > slideshowView.height ? slideshowView.width : slideshowView.height) / 280;
		var scaleTo = (1.0 + Math.random() * 10 / 10) * scaleFrom;
		var topFrom = 0;
		var topTo = 0;
		var leftFrom = 0;
		var leftTo = 0;

		if (Math.random() < 0.33) {
			topFrom = (slideshowView.width > slideshowView.height ? slideshowView.width : slideshowView.height) - scaleFrom * 280;
			topTo = (slideshowView.width > slideshowView.height ? slideshowView.width : slideshowView.height) - scaleTo * 280;
		} else if (Math.random() < 0.5) {
			topFrom = ((slideshowView.width > slideshowView.height ? slideshowView.width : slideshowView.height) - scaleFrom * 280) * 0.5;
			topTo = ((slideshowView.width > slideshowView.height ? slideshowView.width : slideshowView.height) - scaleTo * 280) * 0.5;
		}

		if (Math.random() < 0.33) {
			leftFrom = (slideshowView.width < slideshowView.height ? slideshowView.width : slideshowView.height) - scaleFrom * 280;
			leftTo = (slideshowView.width < slideshowView.height ? slideshowView.width : slideshowView.height) - scaleTo * 280;
		} else if (Math.random() < 0.5) {
			leftFrom = ((slideshowView.width < slideshowView.height ? slideshowView.width : slideshowView.height) - scaleFrom * 280) * 0.5;
			leftTo = ((slideshowView.width < slideshowView.height ? slideshowView.width : slideshowView.height) - scaleTo * 280) * 0.5;
		}

		if (Math.random() < 0.5) {
			var tmp = scaleFrom;
			scaleFrom = scaleTo;
			scaleTo = tmp;
			tmp = leftFrom;
			leftFrom = leftTo;
			leftTo = tmp;
			tmp = topFrom;
			topFrom = topTo;
			topTo = tmp;
		}

		currentImage.top = topFrom;
		currentImage.left = leftFrom;

		currentImage.width = 280 * scaleFrom;
		currentImage.height = 280 * scaleFrom;

		currentImage.animate({
			duration: self.duration,
			opacity: 1.0,
			top: topTo,
			left: leftTo,
			width: 280 * scaleTo,
			height: 280 * scaleTo
		}, function(){
			var prevImage = currentImage;

			if (currentImage === buffer1Image) {
				currentImage = buffer2Image;
			} else {
				currentImage = buffer1Image;
			}
			currentImage.setOpacity(0.0);
			currentImage.zIndex = 1000;

			prevImage.zIndex = 999;

			self.pointer++;
			setTimeout(kenBurns, self.timeout);
		});
	};

	kenBurns();
	return slideshowView;
};
