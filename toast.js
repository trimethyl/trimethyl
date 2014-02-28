var config = {
	height: 65,
	cancelable: true,
	leftImage: true,
	timeout: 4000,
	background: '#B000'
};

exports.show = show = function(msg, args) {
	args = _.extend(config, args || {});
	var timeout = null;

	var view = Ti.UI.createWindow({
		top: -args.height,
		height: args.height,
		backgroundColor: args.background,
		fullscreen: true
	});

	if (args.cancelable) {
		view.addEventListener('touchstart', function(e){
			clearTimeout(timeout);
			view.animate({ top: -args.height }, function(){ view.close(); });
		});
	}

	if (args.leftImage) {
		view.add(Ti.UI.createImageView({
			left: 10,
			image: '/appicon.png',
			width: args.height-20,
			height: args.height-20,
			borderRadius: (args.height-20)/2,
			touchEnabled: false
		}));
	}

	view.add(Ti.UI.createLabel({
		color: '#fff',
		text: msg,
		touchEnabled: false,
		left: 10 + (args.leftImage ? args.height-5 : 0),
		top: 10,
		bottom: 10,
		right: 10,
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		font: { fontSize: 14 }
	}));

	// border bottom
	view.add(Ti.UI.createView({
		height: 0.5,
		bottom: 0,
		backgroundColor: '#D000'
	}));

	view.open();
	view.animate({ top: 0 });

	if (args.autoHide) {
		timeout = setTimeout(function(){
			view.animate({ top: -args.height }, function(){ view.close(); });
		}, args.timeout);
	}

	return view;
};

exports.init = function(c) {
	config = _.extend(config, c);
};