/*

Util module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

function openURL(url, fallback, error) {
	if (OS_IOS && Ti.Platform.canOpenURL(url)) {
		Ti.Platform.openURL(url);
		return;
	}
	if (fallback) {
		if (typeof(fallback)==='function') fallback();
		else Ti.Platform.openURL(fallback);
		return;
	}
	if (error) {
		alertError(error);
	}
}
exports.openURL = openURL;

function startActivity(opt, error) {
	try {
		Ti.Android.currentActivity.startActivity(Ti.Android.createIntent(opt));
	} catch (ex) {
		if (error) {
			alertError(error);
		}
	}
}
exports.startActivity = startActivity;

exports.fixAutoFocusTextArea = function($textarea) {
	if (!OS_ANDROID) {
		return false;
	}

	$textarea.softKeyboardOnFocus = Ti.UI.Android.SOFT_KEYBOARD_HIDE_ON_FOCUS;
	$textarea.addEventListener('touchstart', function(e){
		$textarea.softKeyboardOnFocus = Ti.UI.Android.SOFT_KEYBOARD_SHOW_ON_FOCUS;
	});
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
		Ti.Platform.openURL('itms-apps://itunes.apple.com/app/id'+Alloy.CFG.app.itunes);
	} else if (OS_ANDROID) {
		Ti.Platform.openURL('https://play.google.com/store/apps/details?id='+Alloy.CFG.app.id+'&reviewId=0');
	}
};

exports.getDomainFromURL = function(url) {
	var matches = url.match(/https?\:\/\/([^\/]*)/i);
	if (!matches) { return ''; }
	return matches[1].replace('www.', '');
};

function alertDialog(title, msg, callback) {
	var dialog = Ti.UI.createAlertDialog({
		title: title,
		message: msg,
		ok: L('OK')
	});
	if (callback) dialog.addEventListener('click', callback);
	dialog.show();
	return dialog;
}
exports.alert = alertDialog;

function alertPrompt(title, msg, buttons, cancelIndex, callback, opt) {
	var dialog = Ti.UI.createAlertDialog(_.extend({
		cancel: cancelIndex,
		buttonNames: buttons,
		message: msg,
		title: title
	}, opt || {}));
	dialog.addEventListener('click', function(e){
		if (OS_IOS && e.index==cancelIndex) return;
		if (OS_ANDROID && e.cancel) return;
		if (callback) callback(e.index);
	});
	dialog.show();
}
exports.prompt = alertPrompt;

exports.confirm = function(title, msg, cb) {
	return alertPrompt(title, msg, [ L('Cancel'), L('Yes') ], 0, cb, { selectedIndex: 1 });
};

function optionDialog(options, cancelIndex, callback, opt) {
	if (OS_ANDROID && cancelIndex>=0) { options.splice(cancelIndex,1); }
	var dialog = Ti.UI.createOptionDialog(_.extend({
		options: options,
		cancel: cancelIndex
	}, opt || {}));
	dialog.addEventListener('click', function(e){
		if (OS_IOS && e.index==cancelIndex) return;
		if (OS_ANDROID && e.cancel) return;
		if (callback) callback(e.index);
	});
	dialog.show();
}
exports.option = optionDialog;

function alertError(msg, callback) {
	return alertDialog(L('Error', 'Error'), msg, callback);
}
exports.alertError = exports.error = alertError;

function isIOS7() {
	return OS_IOS && +(Ti.Platform.version.split(".")[0])>=7;
}
exports.isIOS7 = isIOS7;

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
	if (t) return parseInt(+new Date(t)/1000,10);
	return parseInt(+new Date()/1000, 10);
};

exports.parseJSON = function(json) {
	try {
		return JSON.parse(json) || null;
	} catch (ex) {
		return null;
	}
};

exports.buildQuery = function(obj) {
	if (_.isEmpty(obj)) return '';
	var q = [];
	_.each(obj, function(v, k) {
		if (v!==null && v!==false && v!==undefined) {
			q.push( k + '=' + encodeURIComponent(v) );
		}
	});
	if (!q.length) return '';
	return '?' + q.join('&');
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

exports.isAppFirstUsage = function(){
	return !Ti.App.Properties.hasProperty('app.firstusage');
};

exports.setAppFirstUsage = function(){
	Ti.App.Properties.setString('app.firstusage', +new Date().toString());
};

var Modal = function(args) {
	var self = this;

	self._Window =  Ti.UI.createWindow(args || {});

	var $leftButton = Ti.UI.createButton({ title: L('Cancel') });
	$leftButton.addEventListener('click', function(){ self.close(); });
	self._Window.leftNavButton = $leftButton;

	self._Navigator = require('xp.ui').createNavigationWindow({ window: self._Window });
};

Modal.prototype.close = function(){
	this._Navigator.close();
};

Modal.prototype.open = function(){
	this._Navigator.open({ modal: true });
};

Modal.prototype.add = function($ui){
	this._Window.add($ui);
};

exports.modal = function(args) { return new Modal(args); };
