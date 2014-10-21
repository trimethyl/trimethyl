/**
 * @class  Sharer
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Provide functions to simplify sharing across platforms and social networks
 *
 * Be more Social on your app! ;)f
 *
 */

/**
 * @type {Object}
 */
var config = _.extend({
}, Alloy.CFG.T.sharer);
exports.config = config;


var Util = require('T/util');
var globalCallback = null; // Handle all callbacks

var FB = null;
var dkNappSocial = null;
var benCodingSMS = null;

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
		args.fullText = args.text + ' (' + args.url + ')';
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
 * @method facebook
 * Share on Facebook
 * @param {Object} args
 */
exports.facebook = function(args) {
	args = parseArgs(args);

	// IOS-BUG: iOS Sharer doesn't share Facebook links
	if (/https?\:\/\/(www\.)?facebook\.com/.test(args.url)) args.useSDK = true;

	if (args.useSDK !== true && dkNappSocial !== null && dkNappSocial.isFacebookSupported()) {

		/*
		Native iOS dialog
		*/

		dkNappSocial.facebook({
			text: args.text,
			image: args.image,
			url: args.url
		});

	} else if (FB != null) {

		/*
		Facebook SDK feed dialog
		*/

		FB.dialog('feed', {
			name: args.title,
			description: args.text,
			link: args.url,
			picture: args.imageUrl
		}, function(e) {
			if (e.cancelled === true) {
				onSocialCancel({
					success: false,
					platform: 'facebook'
				});
				return;
			}

			onSocialComplete({
				success: e.success,
				platform: 'facebook'
			});
		});

	} else {

		/*
		Browser sharing
		*/
		Ti.Platform.openURL('https://www.facebook.com/dialog/share' + require('T/util').buildQuery({
			app_id: Ti.App.Properties.getString('ti.facebook.appid', false),
			display: 'touch',
			redirect_uri: Ti.App.url,
			href: args.url
		}));

	}
};

/**
 * @method twitter
 * Share on Twitter
 * @param {Object} args
 */
exports.twitter = function(args) {
	parseArgs(args);

	var WEB_URL = 'http://www.twitter.com/intent';
	var webIntent = null;

	if (args.retweet != null) {
		webIntent = WEB_URL + '/retweet' + require('T/util').buildQuery({
			tweet_id: args.retweet
		});
	} else {
		webIntent = WEB_URL + '/tweet' + require('T/util').buildQuery({
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

		if (args.native !== false && dkNappSocial !== null && dkNappSocial.isTwitterSupported()) {

			/*
			Native iOS Dialog
			*/

			var text = args.text;
			if (args.retweetUser) {
				text = 'RT @' + args.retweetUser + ': ' + text;
			}

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

			Util.openURL('twitter://post?message=' + encodeURIComponent(args.fullText), webIntent);

		}
	}
};

/**
 * @method email
 * Share via Mail
 * @param {Object} args
 */
exports.email = function(args) {
	args = parseArgs(args);

	var $dialog = Ti.UI.createEmailDialog({
		subject: args.subject || args.title,
		messageBody: args.fullText,
	});

	if (args.imageBlob != null) {
		$dialog.addAttachment(args.imageBlob);
	}

	$dialog.addEventListener('complete', function(e) {
		if (e.result === this.CANCELLED) {
			onSocialCancel({
				success: false,
				platform: 'mail'
			});
			return;
		}

		onSocialComplete({
			success: (e.result === this.SENT),
			platform: 'mail'
		});
	});

	$dialog.open();
};

/**
 * @method googleplus
 * Share on Google Plus
 * @param {Object} args
 */
exports.googleplus = function(args) {
	args = parseArgs(args);
	if (_.isEmpty(args.url)) {
		Ti.API.error('Sharer: sharing on G+ require a URL');
		return;
	}

	/*
	Browser unique implementation
	*/
	Ti.Platform.openURL('https://plus.google.com/share?url=' + encodeURIComponent(args.url));
};

/**
 * @method whatsapp
 * Share via Whatsapp
 * @param {Object} args
 */
exports.whatsapp = function(args) {
	args = parseArgs(args);

	if (OS_IOS) {

		/*
		Native protocol binding
		 */
		Util.openURL('whatsapp://send?text=' + args.fullText, function() {
			require('T/dialog').confirmYes(L('app_not_installed', 'App not installed'), String.format(L('app_install_question', 'Do you want to install %s?'), 'Whatsapp'), function() {
				Util.openInStore('310633997');
			}, L('install_app', 'Install app'));
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
			if (intent == null) throw new Error();
			intent.putExtra(Ti.Android.EXTRA_TEXT, args.fullText);
			Ti.Android.currentActivity.startActivity(intent, L('Share'));
		} catch (err) {
			require('T/dialog').confirmYes(L('app_not_installed', 'App not installed'), String.format(L('app_install_question', 'Do you want to install %s?'), 'Whatsapp'), function() {
				Util.openInStore('com.whatsapp');
			}, L('install_app', 'Install app'));
		}

	}
};

/**
 * @method message
 * Share via Messages
 * @param {Object} args
 */
exports.message = function(args) {
	args = parseArgs(args);

	if (OS_IOS) {

		if (benCodingSMS == null) {
			Ti.API.error('Sharer: `bencoding.sms` module is required to send SMS');
			return;
		}

		/*
		iOS Native modal
		*/

		var $dialog = benCodingSMS.createSMSDialog({
			messageBody: args.fullText
		});

		$dialog.addEventListener('completed', function(){
			onSocialComplete({ success: true, platform: 'messages' });
		});
		$dialog.addEventListener('cancelled', function(){
			onSocialCancel({ success: false, platform: 'messages' });
		});
		$dialog.addEventListener('errored', function(){
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
};

/**
 * Share using iOS ActivityPopover or Android Intents
 * @param {Object} args
 */
exports.activity = function(args) {
	args = parseArgs(args);

	if (OS_IOS) {

		/*
		iOS Activity native
		*/

		if (dkNappSocial == null) {
			return Ti.API.error('Sharer: module `dk.napp.social` is required for `activity` method');
		}

		dkNappSocial[ Util.isIPad() ? 'activityPopover' : 'activityView' ]({
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

		var intent = Ti.Android.createIntent({
			action: Ti.Android.ACTION_SEND
		});

		if (args.fullText) intent.putExtra(Ti.Android.EXTRA_TEXT, args.fullText);
		if (args.title) intent.putExtra(Ti.Android.EXTRA_TITLE, args.title);
		if (args.image) intent.putExtraUri(Ti.Android.EXTRA_STREAM, args.image);

		Ti.Android.currentActivity.startActivity(Ti.Android.createIntentChooser(intent, L('Share')));

	}
};


/*
Init
*/

// Load modules

FB = T('facebook');
if (FB != null) {
} else {
	Ti.API.warn('Sharer: `facebook` can\'t be loaded');
}

if (OS_IOS) {

	dkNappSocial = require('dk.napp.social');
	if (dkNappSocial != null) {
	} else {
		Ti.API.warn('Sharer: `dk.napp.social` can\'t be loaded');
	}

	benCodingSMS = require('bencoding.sms');
	if (benCodingSMS != null) {
		dkNappSocial.addEventListener('complete', onSocialComplete);
		dkNappSocial.addEventListener('cancelled', onSocialCancel);
	} else {
		Ti.API.warn('Sharer: `bencoding.sms` can\'t be loaded');
	}

}
