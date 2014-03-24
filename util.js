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

exports.getScreenDensity = function() {
	if (OS_ANDROID) {
		return Ti.Platform.displayCaps.logicalDensityFactor;
	}
	return Titanium.Platform.displayCaps.dpi/160;
};

exports.getScreenWidth = function(){
	if (OS_IOS) {
		return Ti.Platform.displayCaps.platformWidth;
	}
	return Ti.Platform.displayCaps.platformWidth/Ti.Platform.displayCaps.logicalDensityFactor;
};

exports.getScreenHeight = function(){
	if (OS_IOS) {
		return Ti.Platform.displayCaps.platformHeight;
	}
	return Ti.Platform.displayCaps.platformHeight/Ti.Platform.displayCaps.logicalDensityFactor;
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

exports.getDomainFromURL = function(url) {
	var matches = url.match(/https?\:\/\/([^\/]*)/i);
	if (!matches) {
		return '';
	}
	return matches[1].replace('www.', '');
};

exports.alert = alertDialog = function(title, msg, callback) {
	var d = Ti.UI.createAlertDialog({
		title: title,
		message: msg,
		ok: L('OK','OK')
	});
	if (callback) {
		d.addEventListener('click', callback);
	}
	d.show();
	return d;
};

exports.prompt = alertPrompt = function(title, msg, buttons, cancelIndex, callback) {
	var dialog = Ti.UI.createAlertDialog({
		cancel: cancelIndex,
		buttonNames: buttons,
		message: msg,
		title: title
	});
	dialog.addEventListener('click', function(e){
		if (e.index==e.source.cancel) {
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
	if (!OS_IOS) {
		return false;
	}
	return parseInt(Ti.Platform.version.split(".")[0],10)>=7;
};

exports.isIPad = function(){
	return (OS_IOS && Ti.Platform.osname === 'ipad');
};

exports.ellipse = function(text, len){
	len = len || 12;
	if (text && text.length>=len) {
		return text.substr(0,len-2)+'..';
	}
	return text;
};

exports.parseSchema = function() {
	if (OS_IOS) {
		var cmd = Ti.App.getArguments();
		if (cmd && 'url' in cmd) return cmd.url.replace(/[^:]*\:\/\//, '');
	} else if (OS_ANDROID) {
		var url = Ti.Android.currentActivity.intent.data;
		if (!url) return;
		return url.replace(/[^:]*\:\/\//, '');
	}
};

exports.init = function(c) {
	config = _.extend(config, c);
};