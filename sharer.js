/**
 * @class  Sharer
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Provide functions to simplify sharing across platforms and social networks
 *
 * Be more Social on your app! ;)
 *
 */

/**
 * @type {Object}
 */
var config = _.extend({}, Alloy.CFG.T.sharer);
exports.config = config;

var Util = require('T/util');

// Handle all callbacks by this-
var callback = null;

// Native modules
var dkNappSocial = null;
var Facebook = null;
var benCodingSMS = null;

function onSocialComplete(e) {
	if (!callback) return;
	e.type = 'complete';
	if (e.activityName) e.platform = e.activityName;
	callback(e);
}

function onSocialCancel(e) {
	if (!callback) return;
	e.type = 'cancelled';
	if (e.activityName) e.platform = e.activityName;
	callback(e);
}

function parseArgs(args) {
	if (!args) return {};

	if (args.image) {
		if (_.isObject(args.image)) {
			if (args.image.resolve) {
				args.imageBlob = args.image;
				args.image = args.imageBlob.resolve();
			} else if (args.image.nativePath) {
				args.imageBlob = args.image;
				args.image = args.imageBlob.nativePath;
			} else {
				delete args.image;
			}
		} else if (_.isString(args.image) && args.image.indexOf('://')) {
			args.imageUrl = args.image;
		}
	}

	if (args.link) {
		args.url = args.link;
		delete args.link;
	}

	if (args.removeIcons && args.removeIcons=='ALL') {
		args.removeIcons = 'print,sms,copy,contact,camera,readinglist';
	}

	if (args.text && args.url) args.fullText = args.text + ' (' + args.url + ')';
	else if (args.text) args.fullText = args.text;
	else if (args.url) args.fullText = args.url;

	delete args.callback;
	return args;
}



/**
 * @method internal
 * Open the following url inside the app, in a webview
 *
 * Require the widget **com.caffeinalab.titanium.modalwindow**
 *
 * @param  {String} url The URL to open
 */
function internal(url) {
	require('T/ui').createModalWebView({
		title: L('Share'),
		url: url
	}).open();
}
exports.internal = internal;


/**
 * @method facebook
 * Share on Facebook
 * @param {Object} args
 */
function facebook(args) {
	callback = args.callback || null;
	args = parseArgs(args);

	// IOS-BUG: iOS Sharer doesn't share Facebook links
	if (args.url && args.url.match(/https?\:\/\/(www\.)?facebook\.com/)) {
		args.useSDK = true;
	}

	if (!args.useSDK && args.native!==false && dkNappSocial && dkNappSocial.isFacebookSupported()) {

		/*
		Native iOS dialog
		*/

		dkNappSocial.facebook({
			text: args.text,
			image: args.image,
			url: args.url
		});

	} else if (Facebook) {

		/*
		Facebook SDK feed dialog
		*/

		Facebook.dialog('feed', {
			name: args.title,
			description: args.text,
			link: args.url,
			picture: args.imageUrl
		}, function(e) {

			if (!e.cancelled) {
				onSocialComplete({
					success: e.success,
					platform: 'facebook'
				});
			} else {
				onSocialCancel({
					success: false,
					platform: 'facebook'
				});
			}

		});

	} else {

		/*
		Browser sharing
		*/

		if (args.url) {
			Ti.Platform.openURL('https://www.facebook.com/sharer.php?u='+args.url);
		}

	}
}
exports.facebook = facebook;

/**
 * @method twitter
 * Share on Twitter
 * @param {Object} args
 */
function twitter(args) {
	callback = args.callback || null;
	parseArgs(args);

	var WEB_URL = 'http://www.twitter.com/intent';
	var webIntent;
	if (args.retweet) {
		webIntent = WEB_URL+'/retweet?tweet_id='+args.retweet;
	} else {
		webIntent = WEB_URL+'/tweet'+require('T/util').buildQuery({
			text: args.text,
			url: args.url
		});
	}

	if (OS_ANDROID) {

		/*
		Android Intent automatic handle
		*/

		Ti.Platform.openURL(webIntent);

	} else {

		if (args.native!==false && dkNappSocial && dkNappSocial.isTwitterSupported()) {

			/*
			Native iOS Dialog
			*/

			var text = args.text;
			if (args.retweetUser) text = 'RT @'+args.retweetUser+': '+text;

			dkNappSocial.twitter({
				text: text,
				image: args.image,
				url: args.url
			});

		} else  {

			/*
			Twitter app native sharing
			Browser fallback
			*/

			Util.openURL('twitter://post?message='+encodeURIComponent(args.fullText), webIntent);

		}
	}

}
exports.twitter = twitter;

/**
 * @method mail
 * Share via Mail
 * @param {Object} args
 */
function mail(args) {
	callback = args.callback || null;
	args = parseArgs(args);

	var $dialog = Ti.UI.createEmailDialog({
		subject: args.subject || args.title,
		messageBody: args.fullText,
	});

	if (args.imageBlob) {
		$dialog.addAttachment(args.imageBlob);
	}

	$dialog.addEventListener('complete', function(e) {
		if (e.result===this.CANCELLED) {
			onSocialCancel({
				success: false,
				platform: 'mail'
			});
		} else {
			onSocialComplete({
				success: (e.result===this.SENT),
				platform: 'mail'
			});
		}
	});

	$dialog.open();
}
exports.mail = mail;


/**
 * @method googleplus
 * Share on Google Plus
 * @param {Object} args
 */
function googleplus(args) {
	args = parseArgs(args);
	if (!args.url) {
		Ti.API.error("Sharer: sharing on G+ require a URL");
		return;
	}

	/*
	Browser unique implementation
	*/
	Ti.Platform.openURL("https://plus.google.com/share?url="+encodeURIComponent(args.url));
}
exports.googleplus = googleplus;


/**
 * @method whatsapp
 * Share via Whatsapp
 * @param {Object} args
 */
function whatsapp(args) {
	args = parseArgs(args);

	if (OS_IOS) {

		/*
		Native protocol binding
		 */
		Util.openURL('whatsapp://send?text='+args.fullText, function() {
			Util.confirm(null, String.format(L('sharer_app_not_installed'), 'Whatsapp'), function() {
				Util.openInStore('310633997');
			});
		});

	} else if (OS_ANDROID) {

		/*
		Android Intent using package
		*/
		try {
			var intent = Ti.Android.createIntent({
				action: Ti.Android.ACTION_SEND,
				type: 'text/plain',
				packageName: 'com.whatsapp'
			});
			if (!intent) throw new Error();
			intent.putExtra(Ti.Android.EXTRA_TEXT, args.fullText);
			Ti.Android.currentActivity.startActivity(intent, L('Share'));
		} catch (err) {
			Util.confirm(Ti.App.name, String.format(L('sharer_app_not_installed'), 'Whatsapp'), function() {
				Util.openInStore('com.whatsapp');
			});
		}

	}
}
exports.whatsapp = whatsapp;


/**
 * @method sms
 * Share via Messages
 * @param {Object} args
 */
function sms(args) {
	callback = args.callback || null;
	args = parseArgs(args);

	if (OS_IOS && !benCodingSMS) {
		throw new Error("Sharer: 'bencoding.sms' module is required to send SMS");
	}

	if (benCodingSMS) {

		/*
		iOS Native modal
		*/

		var $dialog = benCodingSMS.createSMSDialog({ messageBody: args.fullText });

		$dialog.addEventListener('completed', function(e){
			onSocialComplete({ success: true, platform: 'messages' });
		});

		$dialog.addEventListener('cancelled', function(e){
			onSocialCancel({ success: false, platform: 'messages' });
		});

		$dialog.addEventListener('errored', function(e){
			onSocialComplete({ success: false, platform: 'messages' });
		});

		$dialog.open({ animated: true });

	} else if (OS_ANDROID) {

		/*
		Android Native
		*/

		var intent = Ti.Android.createIntent({
			action: Ti.Android.ACTION_VIEW,
			type: 'vnd.android-dir/mms-sms',
		});
		intent.putExtra('sms_body', args.fullText);
		Ti.Android.currentActivity.startActivity(intent, L('Share'));

	}

}
exports.sms = sms;


/**
 * Share using iOS ActivityPopover or Android Intents
 * @param {Object} args
 */
function activity(args) {
	callback = args.callback || null;
	args = parseArgs(args);

	if (OS_IOS) {

		/*
		iOS Activity native
		*/

		if (!dkNappSocial) {
			throw new Error("Sharer: module 'dk.napp.social' is required for 'activity' method");
		}

		dkNappSocial[ Ti.Platform.osname==='ipad' ? 'activityPopover' : 'activityView' ]
		({
			text: args.text,
			title: args.title,
			image: args.image,
			removeIcons: args.removeIcons,
			view: args.view,
			url: args.url
		}, args.customIcons || []);

	} else if (OS_ANDROID) {

		/*
		Android intents
		*/

		/*
		FACEBOOK-BUG
		EXTRA_TEXT
		https://developers.facebook.com/bugs/332619626816423
		*/

		var intent = Ti.Android.createIntent({ action: Ti.Android.ACTION_SEND });

		if (args.fullText) intent.putExtra(Ti.Android.EXTRA_TEXT, args.fullText);
		if (args.title) intent.putExtra(Ti.Android.EXTRA_TITLE, args.title);
		if (args.image) intent.putExtraUri(Ti.Android.EXTRA_STREAM, args.image);

		Ti.Android.currentActivity.startActivity(Ti.Android.createIntentChooser(intent, L('Share')));

	}
}

exports.activity = activity;
exports.multi = activity;


(function init() {

	// Load modules

	try {
		Facebook = require('facebook');
		if (!Facebook) throw new Error();
	} catch (ex) {
		Ti.API.warn("Sharer: 'facebook' can't be loaded");
	}

	if (OS_IOS) {

		try {
			dkNappSocial = require('dk.napp.social');
			if (!dkNappSocial) throw new Error();
		} catch (ex) {
			Ti.API.warn("Sharer: 'dk.napp.social' can't be loaded");
		}

		try {
			benCodingSMS = require('bencoding.sms');
			if (!benCodingSMS) throw new Error();
		} catch (ex) {
			Ti.API.warn("Sharer: 'bencoding.sms' can't be loaded");
		}

	}

	// Configure modules

	if (!Facebook.appid) {
		if (Ti.App.Properties.hasProperty('ti.facebook.appid')) {
			Facebook.appid = Ti.App.Properties.getString('ti.facebook.appid', false);
		} else {
			Ti.API.error("Sharer: Please specify a Facebook AppID");
		}
	}

	if (dkNappSocial) {
		dkNappSocial.addEventListener('complete', onSocialComplete);
		dkNappSocial.addEventListener('cancelled', onSocialCancel);
	}

})();
