var isOpen = false;
var config = {};

exports.show = _show = function() {
	if (!OS_IOS) return;
	Ti.App.fireEvent('loader.start');

	var root = Ti.UI.createWindow({
		title: 'Feedback'
	});
	var nav = Ti.UI.iOS.createNavigationWindow({
		backgroundColor: '#fff',
		window: root
	});

	var cancelButton = Ti.UI.createButton({
		title: 'Close'
	});
	cancelButton.addEventListener('click', function(e){
		isOpen = false;
		nav.close();
	});
	root.leftNavButton = cancelButton;

	var sendButton = Ti.UI.createButton({
		title: 'Send'
	});
	sendButton.addEventListener('click', function(e){
		var emailDialog = Titanium.UI.createEmailDialog();
		emailDialog.setSubject(config.subject || 'Feedback');
		if (config.recipients) emailDialog.setToRecipients(config.recipients);
		emailDialog.addAttachment(imageView.toImage());
		if (OS_IOS) emailDialog.setHtml(true);

		emailDialog.open();
		Ti.App.fireEvent('loader.start');

		emailDialog.addEventListener('complete', function(){
			isOpen = false;
			setTimeout(function(){
				Ti.App.fireEvent('loader.end');
				nav.close();
			}, 1000);
		});
	});
	root.rightNavButton = sendButton;

	var imageView = Ti.UI.createImageView({
		height: '95%',
		borderWidth: 1,
		borderColor: '#ccc'
	});
	var paintView = require('ti.paint').createPaintView({
		eraseMode: false,
		strokeWidth: 2,
		strokeColor: 'red',
		strokeAlpha: 200
	});
	imageView.add(paintView);
	root.add(imageView);

	Titanium.Media.takeScreenshot(function(e) {
		imageView.image = e.media;
		nav.open({ modal: true, fullscreen: true });
		Ti.App.fireEvent('loader.end');
	});
};

exports.init = function(c) {
	config = _.extend(config, c);
	Ti.Gesture.addEventListener('shake', function(e){
		if (isOpen) return; isOpen = true;
		_show();
	});
};