/**
 * @class  Sharer
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Provide functions to simplify sharing across platforms and social networks
 *
 * Require `dn.napp.social`
 *
 * Documentation:
 * https://github.com/viezel/TiSocial.Framework
 *
 * Be more Social on your app! ;)
 *
 */

/**
 * @type {Object}
 */
var config = _.extend({}, Alloy.CFG.T.sharer);
exports.config = config;


var callback = null;
var dkNappSocial = null;

if (OS_IOS) {
	dkNappSocial = require('dk.napp.social');
	dkNappSocial.addEventListener('complete', onSocialComplete);
	dkNappSocial.addEventListener('cancelled', onSocialCancel);
}

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
		if (typeof args.image === 'object') {
			if (args.image.resolve) {
				args.imageBlob = args.image;
				args.image = args.imageBlob.resolve();
			} else if (args.image.nativePath) {
				args.imageBlob = args.image;
				args.image = args.imageBlob.nativePath;
			} else {
				delete args.image;
			}
		} else if (args.image.indexOf('://')) {
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
 * Open the following url inside the app, in a webview
 * @param  {String} url The URL to open
 */
function webviewShare(url) {
	require('ui').createModalWebView({
		title: L('Share'),
		url: url
	}).open();
}
exports.webviewShare = webviewShare;

/**
 * @method  webview
 * @inheritDoc #webviewShare
 * Alias for {@link #webviewShare}
 */
exports.webview = webviewShare;


/**
 * Share on Facebook
 * @param {Object} args
 */
function shareOnFacebook(args) {
	callback = args.callback || null;
	args = parseArgs(args);

	// iOS Sharer doesn't share Facebook links
	if (args.url && args.url.match(/https?\:\/\/(www\.)?facebook\.com/)) {
		args.useSDK = true;
	}

	if (OS_IOS && dkNappSocial.isFacebookSupported() && !args.useSDK) {

		dkNappSocial.facebook({
			text: args.text,
			image: args.image,
			url: args.url
		});

	} else {

		var FB = require('facebook');

		if (!FB.appid) {
			if (Ti.App.Properties.hasProperty('ti.facebook.appid')) {
				FB.appid = Ti.App.Properties.getString('ti.facebook.appid', false);
			} else {
				Ti.API.error("Sharer: please specify a Facebook AppID");
			}
		}

		FB.dialog('feed', {
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

	}
}
exports.shareOnFacebook = shareOnFacebook;

/**
 * @method facebook
 * @inheritDoc #shareOnFacebook
 * Alias for {@link #shareOnFacebook}
 */
exports.facebook = shareOnFacebook;

/**
 * Share on Twitter
 * @param {Object} args
 */
function shareOnTwitter(args) {
	callback = args.callback || null;
	parseArgs(args);

	var WEB_URL = 'http://www.twitter.com/intent';
	var webIntent;
	if (args.retweet) {
		webIntent = WEB_URL+'/retweet?tweet_id='+args.retweet;
	} else {
		webIntent = WEB_URL+'/tweet'+require('util').buildQuery({
			text: args.text,
			url: args.url
		});
	}


	if (OS_ANDROID) {

		try {
			Ti.Platform.openURL(webIntent);
		} catch (e) {}

	} else if (OS_IOS && dkNappSocial.isTwitterSupported()) {

		var text = args.text;
		if (args.retweetUser) text = 'RT @'+args.retweetUser+': '+text;

		dkNappSocial.twitter({
			text: text,
			image: args.image,
			url: args.url
		});

	} else {
		require('util').openURL('twitter://post?message='+encodeURIComponent(args.fullText), webIntent);
	}

}
exports.twitter = shareOnTwitter;

/**
 * @method twitter
 * @inheritDoc #shareOnTwitter
 * Alias for {@link #shareOnTwitter}
 */
exports.twitter = shareOnTwitter;

/**
 * Share via Mail
 * @param {Object} args
 */
function shareViaMail(args) {
	callback = args.callback || null;
	args = parseArgs(args);

	var $dialog = Ti.UI.createEmailDialog({
		subject: args.title,
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
exports.shareViaMail = shareViaMail;

/**
 * @method  mail
 * @inheritDoc #shareViaMail
 * Alias for {@link #shareViaMail}
 */
exports.mail = shareViaMail;


/**
 * Share on Google Plus
 * @param {Object} args
 */
function shareOnGooglePlus(args) {
	args = parseArgs(args);
	if (!args.url) {
		Ti.API.error("Sharer: sharing on G+ require a URL");
		return;
	}

	try {
		Ti.Platform.openURL("https://plus.google.com/share?url="+encodeURIComponent(args.url));
	} catch (e) {}
}
exports.shareOnGooglePlus = shareOnGooglePlus;

/**
 * Share via Whatsapp
 * @param {Object} args
 */
function shareOnWhatsApp(args) {
	args = parseArgs(args);

	try {
		Ti.Platform.openURL('whatsapp://send?text='+args.fullText);
	} catch (e) {}
}
exports.shareOnWhatsApp = shareOnWhatsApp;


/**
 * Share using iOS ActivityPopover or Android Intents
 * @param {Object} args
 */
function activity(args) {
	callback = args.callback || null;
	args = parseArgs(args);

	if (OS_IOS) {

		dkNappSocial[Ti.Platform.osname=='ipad'?'activityPopover':'activityView']
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
		Facebook bug with EXTRA_TEXT
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
