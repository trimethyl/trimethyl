/**
 * @module  sharer
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var Alloy = require('alloy');
var _ = require('alloy/underscore')._;

/**
 * @property config
 */
exports.config = _.extend({
}, Alloy.CFG.T ? Alloy.CFG.T.sharer : {});


var Util = require('T/util');
var GA = require('T/ga');
var Dialog = require('T/dialog');

var globalCallback = null; // Handle all callbacks

function onSocialComplete(e) {
	if (!_.isFunction(globalCallback)) return;

	e.type = 'complete';
	if (e.activityName) e.platform = e.activityName;
	globalCallback(e);
}

function onSocialCancel(e) {
	if (!_.isFunction(globalCallback)) return;

	e.type = 'cancelled';
	if (e.activityName) e.platform = e.activityName;
	globalCallback(e);
}

function parseArgs(args) {
	if (!_.isObject(args)) return {};
	args = _.clone(args);

	if (args.image != null) {
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
		} else if (_.isString(args.image) && args.image.indexOf('://') !== -1) {
			args.imageUrl = args.image;
		}
	}

	if (args.link != null) {
		args.url = args.link;
		delete args.link;
	}

	if (args.removeIcons === 'ALL') args.removeIcons = 'print,sms,copy,contact,camera,readinglist';

	if (args.text != null && args.url != null) {
		args.fullText = args.text + ' ' + args.url;
	} else if (args.text != null) {
		args.fullText = args.text;
	} else if (args.url != null) {
		args.fullText = args.url;
	}

	if (_.isFunction(args.callback)) {
		globalCallback = args.callback;
		delete args.callback;
	}

	return args;
}


/**
 * Share on Facebook
 * @param {Object} args
 */
exports.facebook = function(args) {
	args = parseArgs(args);
	GA.social('facebook', 'share', args.url);

	// Native iOS dialog
	if (OS_IOS && (dkNappSocial != null && dkNappSocial.isFacebookSupported()) &&
		false === /https?\:\/\/(www\.)?facebook\.com/.test(args.url) // BUG: iOS share dialog doesn't share Facebook links
	) {
		dkNappSocial.facebook({
			text: args.text,
			image: args.image,
			url: args.url
		});
		return true;
	}

	// SDK
	if (FB != null) {
		FB.presentShareDialog({
			link: args.url,
			title: args.title,
			description: args.description || args.text
		});
		return true;
	}

	// Android Native intent
	if (OS_ANDROID) {
		try {
			var intent = Ti.Android.createIntent({
				action: Ti.Android.ACTION_SEND,
				packageName: 'com.facebook.katana',
				type: 'text/plain'
			});
			intent.putExtra(Ti.Android.EXTRA_TEXT, args.url);
			Ti.Android.currentActivity.startActivity(intent);

			return true;
		} catch (err) {}
	}

	// Fallback
	Ti.Platform.openURL('http://www.facebook.com/dialog/share' + Util.buildQuery({
		app_id: (Alloy.CFG.T.fb || Alloy.CFG.T.facebook || {}).appID,
		display: 'touch',
		redirect_uri: args.redirect_uri || Ti.App.url,
		href: args.url
	}));
};


/**
 * Share on Twitter
 * @param {Object} args
 */
exports.twitter = function(args) {
	args = parseArgs(args);
	GA.social('twitter', 'share', args.url);

	var text = (args.tweetText || args.text);
	var textWithUrl = text;
	if (args.url != null) {
		textWithUrl = text ? (text + ' (' + args.url + ')') : args.url;
	}

	// Native iOS Dialog
	if (OS_IOS && (dkNappSocial != null && dkNappSocial.isTwitterSupported())) {
		dkNappSocial.twitter({
			text: text,
			image: args.image,
			url: args.url
		});
		return true;
	}

	// iOS Tweetbot App
	if (OS_IOS) {
		var tweetbotNativeURL = 'tweetbot:///post' + Util.buildQuery({
			text: textWithUrl
		});
		if (Ti.Platform.canOpenURL(tweetbotNativeURL)) {
			Ti.Platform.openURL(tweetbotNativeURL);
			return true;
		}
	}

	// iOS Twitter App
	if (OS_IOS) {
		var twitterNativeURL = 'twitter://post' + Util.buildQuery({
			message: textWithUrl
		});
		if (Ti.Platform.canOpenURL(twitterNativeURL)) {
			Ti.Platform.openURL(twitterNativeURL);
			return true;
		}
	}

	// Fallback
	Ti.Platform.openURL('http://www.twitter.com/intent/tweet' + Util.buildQuery({
		 text: text,
		 url: args.url
	}));
};


/**
 * Share via Mail
 * @param {Object} args
 */
exports.email = exports.mail = function(args) {
	args = parseArgs(args);
	GA.social('email', 'sent', args.url);

	var $dialog = Ti.UI.createEmailDialog({
		subject: args.subject || args.title,
		messageBody: args.fullText,
		toRecipients: args.mailTo || []
	});

	if (args.imageBlob != null) {
		$dialog.addAttachment(args.imageBlob);
	}

	$dialog.addEventListener('complete', function(e) {
		if (e.result !== this.CANCELLED) {
			onSocialComplete({
				success: (e.result === this.SENT),
				platform: 'email'
			});
		} else {
			onSocialCancel({
				success: false,
				platform: 'email'
			});
		}
	});

	$dialog.open();
};


/**
 * Share via Whatsapp
 * @param {Object} args
 */
exports.whatsapp = function(args) {
	args = parseArgs(args);
	GA.social('whatsapp', 'share', args.url);

	// Native protocol binding
	if (OS_IOS) {
		Util.openURL('whatsapp://send?text=' + args.fullText, function() {
			Dialog.confirmYes(
				L('app_not_installed', 'App not installed'),
				String.format(L('app_install_question', 'You must install %s to proceed.'), 'Whatsapp'),
			function() {
				Util.openInStore('310633997');
			}, L('install_app', 'Install app'));
		});

		return true;
	}

	// Android Intent using package
	if (OS_ANDROID) {
		try {
			var intent = Ti.Android.createIntent({
				action: Ti.Android.ACTION_SEND,
				type: 'text/plain',
				packageName: 'com.whatsapp'
			});
			intent.putExtra(Ti.Android.EXTRA_TEXT, args.fullText);
			Ti.Android.currentActivity.startActivity(intent, L('share', 'Share'));

			return true;
		} catch (err) {
			Dialog.confirmYes(L('app_not_installed', 'App not installed'), String.format(L('app_install_question', 'Do you want to install %s?'), 'Whatsapp'), function() {
				Util.openInStore('com.whatsapp');
			}, L('install_app', 'Install app'));
		}
	}
};

/**
 * Share via Telegram
 * @param {Object} args
 */
exports.telegram = function(args) {
	args = parseArgs(args);
	GA.social('telegram', 'share', args.url);

	Ti.Platform.openURL('https://telegram.me/share/url' + Util.buildQuery({
		url: args.url,
		text: args.text
	}));

	return true;
};


/**
 * Share via Messages
 * @param {Object} args
 */
exports.message = exports.sms = function(args) {
	args = parseArgs(args);
	GA.social('message', 'sent', args.url);

	// iOS Native modal
	if (OS_IOS && benCodingSMS !== null) {
		var recipients = null;
		if (args.recipients != null) recipients = _.isArray(args.recipients) ? args.recipients : [ args.recipients ];

		var $dialog = benCodingSMS.createSMSDialog({
			toRecipients: recipients,
			messageBody: args.fullText
		});

		$dialog.addEventListener('completed', function(){
			onSocialComplete({
				success: true,
				platform: 'messages'
			});
		});

		$dialog.addEventListener('cancelled', function(){
			onSocialCancel({
				success: false,
				platform: 'messages'
			});
		});

		$dialog.addEventListener('error', function(){
			onSocialComplete({
				success: false,
				platform: 'messages'
			});
		});

		$dialog.open({
			animated: true
		});

		return true;
	}

	// Android Native
	if (OS_ANDROID) {
		var url = 'sms:';
		if (args.recipients != null) url += _.isArray(args.recipients) ? args.recipients[0] : args.recipients;

		url += Util.buildQuery({
			body: args.fullText
		});

		return Ti.Platform.openURL(url);
	}
};


/**
 * Share using iOS ActivityPopover or Android Intents
 * @param {Object} args
 */
exports.activity = function(args) {
	args = parseArgs(args);

	// iOS Activity native
	if (OS_IOS && dkNappSocial != null) {
		dkNappSocial[ Ti.Platform.osname === 'ipad' ? 'activityPopover' : 'activityView' ]({
			text: args.text,
			title: args.title,
			image: args.image,
			removeIcons: args.removeIcons,
			view: args.view,
			url: args.url
		}, args.customIcons || []);

		return true;
	}

	// Android intents
	if (OS_ANDROID) {
		var intent = Ti.Android.createIntent({ action: Ti.Android.ACTION_SEND });
		if (args.fullText) intent.putExtra(Ti.Android.EXTRA_TEXT, args.fullText);
		if (args.title) intent.putExtra(Ti.Android.EXTRA_TITLE, args.title);
		if (args.image) intent.putExtraUri(Ti.Android.EXTRA_STREAM, args.image);

		Ti.Android.currentActivity.startActivity(Ti.Android.createIntentChooser(intent, L('share', 'Share')));

		return true;
	}
};


/*
Init
*/

var FB = Util.requireOrNull('T/fb');
if (FB != null) {
	FB.addEventListener('shareCompleted', onSocialComplete);
}

if (OS_IOS) {

	var benCodingSMS = Util.requireOrNull('bencoding.sms');

	var dkNappSocial = Util.requireOrNull('dk.napp.social');
	if (dkNappSocial != null) {
		dkNappSocial.addEventListener('complete', onSocialComplete);
		dkNappSocial.addEventListener('cancelled', onSocialCancel);
	}

}
