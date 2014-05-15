/*

Share module
Author: Flavio De Stefano
Company: Caffeina SRL

Requirements:
gittio install -g dk.napp.social

Documentation:
https://github.com/viezel/TiSocial.Framework

Be more social!

*/

var config = _.extend({}, Alloy.CFG.sharer);

var callback = null;
var Social = null;

if (OS_IOS) {
	Social = require('dk.napp.social');
	Social.addEventListener('complete', __onSocialComplete);
	Social.addEventListener('cancelled', __onSocialCancelled);
}

function __onSocialComplete(e) {
	if (!callback) {
		return;
	}

	e.type = 'complete';
	if (e.activityName) e.platform = e.activityName;
	callback(e);
}

function __onSocialCancelled(e) {
	if (!callback) {
		return;
	}

	e.type = 'cancelled';
	if (e.activityName) e.platform = e.activityName;
	callback(e);
}

function __parseArgs(args) {
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


function webviewShare(url) {
	require('ui').createModalWebView({
		title: L('Share'),
		url: url
	}).open();
}
exports.webview = webviewShare;

function shareOnFacebook(args, _callback) {
	callback = args.callback || null;
	args = __parseArgs(args);

	// iOS Sharer doesn't share Facebook links
	if (args.url && args.url.match(/https?\:\/\/(www\.)?facebook\.com/)) {
		args.useSDK = true;
	}

	if (OS_IOS && Social.isFacebookSupported() && !args.useSDK) {

		Social.facebook({
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
				__onSocialComplete({
					success: e.success,
					platform: 'facebook'
				});
			} else {
				__onSocialCancelled({
					success: false,
					platform: 'facebook'
				});
			}

		});

	}
}
exports.facebook = shareOnFacebook;

function shareOnTwitter(args) {
	callback = args.callback || null;
	__parseArgs(args);

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

	} else if (OS_IOS && Social.isTwitterSupported() && !args.retweet) {

		Social.twitter({
			text: args.text,
			image: args.image,
			url: args.url
		});

	} else {

		require('util').openURL('twitter://post?message='+encodeURIComponent(args.fullText), webIntent);

	}

}
exports.twitter = shareOnTwitter;


function shareViaMail(args, _callback) {
	callback = args.callback || null;
	args = __parseArgs(args);

	var $dialog = Ti.UI.createEmailDialog({
		subject: args.title,
		messageBody: args.fullText,
	});

	if (args.imageBlob) {
		$dialog.addAttachment(args.imageBlob);
	}

	$dialog.addEventListener('complete', function(e) {
		if (e.result===this.CANCELLED) {
			__onSocialCancelled({
				success: false,
				platform: 'mail'
			});
		} else {
			__onSocialComplete({
				success: (e.result===this.SENT),
				platform: 'mail'
			});
		}
	});

	$dialog.open();
}
exports.mail = shareViaMail;


function shareOnGooglePlus(args, _callback) {
	args = __parseArgs(args);
	if (!args.url) {
		Ti.API.error("Sharer: sharing on G+ require a URL");
		return;
	}

	try {
		Ti.Platform.openURL("https://plus.google.com/share?url="+encodeURIComponent(args.url));
	} catch (e) {}
}
exports.googleplus = exports.googlePlus = shareOnGooglePlus;


function shareOnWhatsApp(args, _callback) {
	args = __parseArgs(args);

	try {
		Ti.Platform.openURL('whatsapp://send?text='+args.fullText);
	} catch (e) {}
}
exports.whatsapp = exports.whatsApp = shareOnWhatsApp;

/*
ActivityView
*/

exports.activity = exports.multi = function(args, _callback) {
	callback = args.callback || null;
	args = __parseArgs(args);

	if (OS_IOS) {

		Social[Ti.Platform.osname=='ipad'?'activityPopover':'activityView']
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
};