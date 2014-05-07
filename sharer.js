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

	if (args.removeIcons=='ALL') {
		args.removeIcons = 'print,sms,copy,contact,camera,readinglist';
	}

	return args;
}


function webviewShare(url) {
	require('ui').createModalWebView({
		title: L('Share'),
		url: url
	}).open();
}
exports.webview = webviewShare;


function shareOnTwitter(args) {
	callback = args.callback || null;
	__parseArgs(args);

	var intentUrl = 'https://twitter.com/intent/tweet?url='+encodeURIComponent(args.url)+'&text='+encodeURIComponent(args.text);

	if (OS_IOS) {

		if (Social.isTwitterSupported()) {
			Social.twitter({
				text: args.text,
				image: args.image,
				url: args.url
			});
		} else {
			var shareUrl = 'twitter://post?message='+encodeURIComponent(args.text+' ('+args.url+')');
			require('util').openURL(shareUrl, function(){
				webviewShare(intentUrl);
			});
		}

	} else {
		Ti.Platform.openURL(intentUrl);
	}
}
exports.twitter = shareOnTwitter;


function shareOnFacebook(args, _callback) {
	callback = args.callback || null;
	args = __parseArgs(args);

	if (OS_IOS && Social.isFacebookSupported() && !args.useSDK) {

		Social.facebook({
			text: args.text,
			image: args.image,
			url: args.url
		});

	} else {

		var FB = require('facebook');
		if (FB && Ti.App.Properties.hasProperty('ti.facebook.appid')) {
			if (!FB.appid) FB.appid = Ti.App.Properties.getString('ti.facebook.appid');

			FB.dialog('feed', {
				name: args.title,
				description: args.text,
				link: args.url,
				picture: args.imageUrl
			}, function(e) {

				if (e.cancelled) {
					__onSocialCancelled({
						success: false,
						platform: 'facebook'
					});
				} else {
					__onSocialComplete({
						success: e.success,
						platform: 'facebook'
					});
				}

			});

		} else {


		}
	}
}
exports.facebook = shareOnFacebook;


function shareViaMail(args, _callback) {
	callback = args.callback || null;
	args = __parseArgs(args);

	var $dialog = Ti.UI.createEmailDialog({
		html: true,
		subject: args.title,
		messageBody: args.text + (args.url ? ("<br><br>"+args.url) : ''),
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
	webviewShare("https://plus.google.com/share?url="+encodeURIComponent(args.url));
}
exports.googleplus = exports.googlePlus = shareOnGooglePlus;


function shareOnWhatsApp(args, _callback) {
	args = __parseArgs(args);
	if (args.url) args.text += ' (' + args.url + ')';
	Ti.Platform.openURL('whatsapp://send?text='+args.text);
}
exports.whatsapp = exports.whatsApp = shareOnWhatsApp;

/*
ActivityView
*/

exports.options = exports.multi = exports.activity = function(args, _callback) {
	callback = 	callback = args.callback || null;
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

		var intent = Ti.Android.createIntent({ action: Ti.Android.ACTION_SEND });
		if (args.text) intent.putExtra(Ti.Android.EXTRA_TEXT, args.text);
		if (args.image) intent.putExtraUri(Ti.Android.EXTRA_STREAM, args.image);

		Ti.Android.currentActivity.startActivity(Ti.Android.createIntentChooser(intent, args.title));
	}
};