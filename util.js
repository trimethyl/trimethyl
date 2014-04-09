/*

Util module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var config = {};

exports.openURL = openURL = function(url, fallback, error) {
	if (OS_IOS && Ti.Platform.canOpenURL(url)) {
		Ti.Platform.openURL(url);
	}
	if (fallback) {
		return Ti.Platform.openURL(fallback);
	}
	if (error) {
		alertError(error);
	}
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
	return openURL("twitter://user?screen_name="+twid, "http://twitter.com/"+twid);
};

exports.getFacebookAvatar = function(fbid, w, h) {
	return 'http://graph.facebook.com/'+fbid+'/picture/?width='+(w||150)+'&height='+(h||150);
};

exports.reviewInStore = function() {
	alert("WORK IN PROGRESS");
};

exports.getDomainFromURL = function(url) {
	var matches = url.match(/https?\:\/\/([^\/]*)/i);
	if (!matches) { return ''; }
	return matches[1].replace('www.', '');
};

exports.alert = alertDialog = function(title, msg, callback) {
	var dialog = Ti.UI.createAlertDialog({
		title: title,
		message: msg,
		ok: L('OK')
	});
	if (callback) dialog.addEventListener('click', callback);
	dialog.show();
	return dialog;
};

exports.prompt = alertPrompt = function(title, msg, buttons, cancelIndex, callback, opt) {
	if (OS_ANDROID && cancelIndex>=0) {
		options.splice(cancelIndex,1);
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

exports.option = optionDialog = function(options, cancelIndex, callback, opt) {
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

exports.alertError = alertError = function(msg, callback) {
	return alertDialog(L('Error', 'Error'), msg, callback);
};

exports.isIOS7 = isIOS7 = function() {
	if (!OS_IOS) { return false; }
	return parseInt(Ti.Platform.version.split(".")[0],10)>=7;
};

exports.parseSchema = function() {
	if (OS_IOS) {
		var cmd = Ti.App.getArguments();
		if (cmd && 'url' in cmd) { return cmd.url.replace(/[^:]*\:\/\//, ''); }
	} else if (OS_ANDROID) {
		var url = Ti.Android.currentActivity.intent.data;
		if (url) { return url.replace(/[^:]*\:\/\//, ''); }
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

exports.init = function(c) {
	config = _.extend(config, c);
};