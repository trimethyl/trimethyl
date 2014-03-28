/*

Toast module
Author: Flavio De Stefano
Company: Caffeina SRL

Provide a toast notification

*/

var config = {
	height: 65,
	cancelable: true,
	leftImage: null,
	timeout: 4000,
	autoHide: true,
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

	view.add(Ti.UI.createImageView({
		left: 10,
		image: args.leftImage || '/appicon.png',
		width: args.height-20,
		height: args.height-20,
		borderRadius: (args.height-20)/2,
		touchEnabled: false
	}));

	view.add(Ti.UI.createLabel(_.extend({
		color: '#fff',
		text: msg,
		touchEnabled: false,
		left: 10 + args.height-5,
		top: 10,
		bottom: 10,
		right: 10,
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		font: { fontSize: 14 }
	}, args.label || {})));

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