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

/* @deprecated -> device.getScreenDensity() */ exports.getScreenDensity = function() {
	return require('device').getScreenDensity();
};

/* @deprecated -> device.getScreenWidth() */ exports.getScreenWidth = function(){
	return require('device').getScreenWidth();
};

/* @deprecated -> device.getScreenHeight() */ exports.getScreenHeight = function(){
	return require('device').getScreenHeight();
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
	if (!matches) {
		return '';
	}
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
	var dialog = Ti.UI.createAlertDialog(_.extend({
		cancel: cancelIndex,
		buttonNames: buttons,
		message: msg,
		title: title
	}, opt || {}));
	dialog.addEventListener('click', function(e){
		if (e.index==cancelIndex) { return; }
		if (callback) callback(e.index);
	});
	dialog.show();
};

exports.option = optionDialog = function(options, cancelIndex, callback, opt) {
	var dialog = Ti.UI.createOptionDialog(_.extend({
		options: options,
		cancel: cancelIndex
	}, opt || {}));
	dialog.addEventListener('click', function(e){
		if (e.index==cancelIndex) { return; }
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

exports.uniqid = function(prefix, more_entropy) {
  //  discuss at: http://phpjs.org/functions/uniqid/
  // original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  //  revised by: Kankrelune (http://www.webfaktory.info/)
  //        note: Uses an internal counter (in php_js global) to avoid collision
  //        test: skip
  //   example 1: uniqid();
  //   returns 1: 'a30285b160c14'
  //   example 2: uniqid('foo');
  //   returns 2: 'fooa30285b1cd361'
  //   example 3: uniqid('bar', true);
  //   returns 3: 'bara20285b23dfd1.31879087'

  if (typeof prefix === 'undefined') {
  	prefix = '';
  }

  var retId;
  var formatSeed = function (seed, reqWidth) {
  	seed = parseInt(seed, 10)
      .toString(16); // to hex str
      if (reqWidth < seed.length) {
      // so long we split
      return seed.slice(seed.length - reqWidth);
   }
   if (reqWidth > seed.length) {
      // so short we pad
      return Array(1 + (reqWidth - seed.length))
      .join('0') + seed;
   }
   return seed;
};

  // BEGIN REDUNDANT
  if (!this.php_js) {
  	this.php_js = {};
  }
  // END REDUNDANT
  if (!this.php_js.uniqidSeed) {
    // init seed with big random int
    this.php_js.uniqidSeed = Math.floor(Math.random() * 0x75bcd15);
 }
 this.php_js.uniqidSeed++;

  // start with prefix, add current milliseconds hex string
  retId = prefix;
  retId += formatSeed(parseInt(new Date()
  	.getTime() / 1000, 10), 8);
  // add seed hex string
  retId += formatSeed(this.php_js.uniqidSeed, 5);
  if (more_entropy) {
    // for more entropy we add a float lower to 10
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