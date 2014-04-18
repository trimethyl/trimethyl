/*

Util module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var config = {};

exports.openURL = function openURL(url, fallback, error) {
	if (OS_IOS && Ti.Platform.canOpenURL(url)) {
		Ti.Platform.openURL(url);
	}
	if (fallback) {
		console.log( fallback );
		if (typeof(fallback)==='function') fallback();
		else Ti.Platform.openURL(fallback);
		return;
	}
	if (error) {
		alertError(error);
	}
};

exports.startActivity = function startActivity(opt, error) {
	try {
		Ti.Android.currentActivity.startActivity(Ti.Android.createIntent(opt));
	} catch (ex) {
		if (error) {
			alertError(error);
		}
	}
};

exports.fixAutoFocusTextArea = function($textarea, $ui) {
	if (!OS_ANDROID) {
		return false;
	}

	$textarea.softKeyboardOnFocus = Ti.UI.Android.SOFT_KEYBOARD_HIDE_ON_FOCUS;
	function onOpen(e) { $textarea.softKeyboardOnFocus = Ti.UI.Android.SOFT_KEYBOARD_SHOW_ON_FOCUS; }
	$ui.addEventListener('open', onOpen);
	return onOpen;
};

exports.getSpinner = function(){
	return Ti.UI.createActivityIndicator({
		style: OS_IOS ? Ti.UI.iPhone.ActivityIndicatorStyle.DARK : Ti.UI.ActivityIndicatorStyle.DARK
	});
};

exports.openFacebookProfile = function(fbid) {
	Ti.Platform.openURL("http://facebook.com/"+fbid);
};

exports.openTwitterProfile = function(twid) {
	return Ti.Platform.openURL("twitter://user?screen_name="+twid, "http://twitter.com/"+twid);
};

exports.getFacebookAvatar = function(fbid, w, h) {
	return 'http://graph.facebook.com/'+fbid+'/picture/?width='+(w||150)+'&height='+(h||150);
};

exports.reviewInStore = function() {
	if (OS_IOS) {
		Ti.Platform.openURL('itms-apps://itunes.apple.com/app/id'+Ti.App.Properties.getString('appstoreid', 0));
	} else if (OS_ANDROID) {
		Ti.Platform.openURL('https://play.google.com/store/apps/details?id='+Ti.App.Properties.getString('id',0)+'&reviewId=0');
	}
};

exports.getDomainFromURL = function(url) {
	var matches = url.match(/https?\:\/\/([^\/]*)/i);
	if (!matches) { return ''; }
	return matches[1].replace('www.', '');
};

exports.alert = function alertDialog(title, msg, callback) {
	var dialog = Ti.UI.createAlertDialog({
		title: title,
		message: msg,
		ok: L('OK')
	});
	if (callback) dialog.addEventListener('click', callback);
	dialog.show();
	return dialog;
};

exports.prompt = function alertPrompt(title, msg, buttons, cancelIndex, callback, opt) {
	if (OS_ANDROID && cancelIndex>=0) {
		buttons.splice(cancelIndex, 1);
	}
	var dialog = Ti.UI.createAlertDialog(_.extend({
		cancel: cancelIndex,
		buttonNames: buttons,
		message: msg,
		title: title
	}, opt || {}));
	dialog.addEventListener('click', function(e){
		if (!OS_ANDROID && e.index==cancelIndex) {
			return;
		}
		if (callback) callback(e.index);
	});
	dialog.show();
};

exports.option = function optionDialog(options, cancelIndex, callback, opt) {
	if (OS_ANDROID && cancelIndex>=0) {
		options.splice(cancelIndex,1);
	}
	var dialog = Ti.UI.createOptionDialog(_.extend({
		options: options,
		cancel: cancelIndex
	}, opt || {}));
	dialog.addEventListener('click', function(e){
		if (!OS_ANDROID && e.index==cancelIndex) {
			return;
		}
		if (callback) callback(e.index);
	});
	dialog.show();
};

exports.alertError = function alertError(msg, callback) {
	return alertDialog(L('Error', 'Error'), msg, callback);
};

exports.isIOS7 = function isIOS7() {
	return OS_IOS && +(Ti.Platform.version.split(".")[0])>=7;
};

exports.parseSchema = function() {
	if (OS_IOS) {
		var cmd = Ti.App.getArguments();
		if (cmd && 'url' in cmd) {
			return cmd.url.replace(/[^:]*\:\/\//, '');
		}
	} else if (OS_ANDROID) {
		var url = Ti.Android.currentActivity.intent.data;
		if (url) {
			return url.replace(/[^:]*\:\/\//, '');
		}
	}

	return '';
};

exports.uniqid = function(prefix, more_entropy) {
	if (typeof prefix === 'undefined') {
		prefix = '';
	}

	var retId;
	var formatSeed = function (seed, reqWidth) {
		seed = parseInt(seed, 10) .toString(16);
		if (reqWidth < seed.length) {
			return seed.slice(seed.length - reqWidth);
		}
		if (reqWidth > seed.length) {
			return Array(1 + (reqWidth - seed.length)).join('0') + seed;
		}
		return seed;
	};

	if (!this.php_js) {
		this.php_js = {};
	}
	if (!this.php_js.uniqidSeed) {
		this.php_js.uniqidSeed = Math.floor(Math.random() * 0x75bcd15);
	}
	this.php_js.uniqidSeed++;

	retId = prefix;
	retId += formatSeed(parseInt(new Date()
		.getTime() / 1000, 10), 8);
	retId += formatSeed(this.php_js.uniqidSeed, 5);
	if (more_entropy) {
		retId += (Math.random() * 10)
		.toFixed(8)
		.toString();
	}

	return retId;
};

exports.timestamp = function(t){
	if (t) {
		return parseInt(+new Date(t)/1000,10);
	}
	return parseInt(+new Date()/1000, 10);
};

exports.parseJSON = function(json) {
	try {
		return JSON.parse(json) || null;
	} catch (ex) {
		return null;
	}
};

exports.getAppDataDirectory = function() {
	if (Ti.Filesystem.isExternalStoragePresent()) {
		return Ti.Filesystem.externalStorageDirectory;
	}
	return Ti.Filesystem.applicationDataDirectory;
};

exports.dial = function(tel) {
	tel = tel.match(/[0-9]/g).join('');
	if (OS_ANDROID) {

		startActivity({
			action: Ti.Android.ACTION_CALL,
			data: 'tel:'+tel
		}, String.format(L('cant_call_number'), tel));

	} else {
		openURL('tel:'+tel, null, String.format(L('cant_call_number'), tel));
	}
};

/* Modal Prototype */

var __Modal = function(args) {
	var self = this;

	self._Window =  Ti.UI.createWindow(args || {});

	var $leftButton = Ti.UI.createButton({ title: L('Cancel') });
	$leftButton.addEventListener('click', function(){ self.close(); });
	self._Window.leftNavButton = $leftButton;

	self._Navigator = require('xp.ui').createNavigationWindow({ window: self._Window });
};

__Modal.prototype.close = function(){ this._Navigator.close(); };
__Modal.prototype.open = function(){ this._Navigator.open({ modal: true }); };
__Modal.prototype.add = function($ui){ this._Window.add($ui); };

exports.modal = function(args) { return new __Modal(args); };

/* End modal prototype */

exports.init = function(c) {
	config = _.extend(config, c);
};