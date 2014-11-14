/**
 * @class  	Sharer
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */


var Util = require('T/util');

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

	// Native iOS dialog
	if (args.useApp !== true
		&& false === /https?\:\/\/(www\.)?facebook\.com/.test(args.url) // iOS share dialog doesn't share Facebook links
	 	&& dkNappSocial != null && dkNappSocial.isFacebookSupported()
	) {
		dkNappSocial.facebook({
			text: args.text,
			image: args.image,
			url: args.url
		});
		return true;
	}

	if (FB != null && _.isFunction(FB.share) /*&& _.isFunction(FB.getCanPresentShareDialog()) && FB.getCanPresentShareDialog() === true*/) {
		FB.share({ url: args.url });
		return true;
	}

	// Fallback
	Ti.Platform.openURL('https://www.facebook.com/dialog/share' + Util.buildQuery({
		app_id: Ti.App.Properties.getString('ti.facebook.appid'),
		display: 'touch',
		redirect_uri: Ti.App.url,
		href: args.url
	}));
};


/**
 * @method twitter
 * Share on Twitter
 * @param {Object} args
 */
exports.twitter = function(args) {
	args = parseArgs(args);

	// Native iOS Dialog
	if (args.useApp !== true
		&& dkNappSocial != null && dkNappSocial.isTwitterSupported()
	) {
		dkNappSocial.twitter({
			text: args.text,
			image: args.image,
			url: args.url
		});
		return true;
	}

	// var tweetbotIOSURL = 'tweetbot://post' + Util.buildQuery({ text: args.fullText });
	// if (OS_IOS && Ti.Platform.canOpenURL(tweetbotIOSURL)) {
	// 	Ti.Platform.openURL(tweetbotIOSURL);
	// 	return true;
	// }

	var nativeIOSURL = 'twitter://post' + Util.buildQuery({ message: args.fullText });
	if (OS_IOS && Ti.Platform.canOpenURL(nativeIOSURL)) {
		Ti.Platform.openURL(nativeIOSURL);
		return true;
	}

	Ti.Platform.openURL('http://www.twitter.com/intent/tweet' + Util.buildQuery({
		 text: args.text,
		 url: args.url
	}));
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

	if (args.imageBlob != null) $dialog.addAttachment(args.imageBlob);

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
 * @method googleplus
 * Share on Google Plus
 * @param {Object} args
 */
exports.googleplus = function(args) {
	args = parseArgs(args);

	Ti.Platform.openURL('https://plus.google.com/share' + Util.buildQuery({
		url: args.url
	}));
};


/**
 * @method whatsapp
 * Share via Whatsapp
 * @param {Object} args
 */
exports.whatsapp = function(args) {
	args = parseArgs(args);

	// Native protocol binding
	if (OS_IOS) {
		Util.openURL('whatsapp://send?text=' + args.fullText, function() {
			require('T/dialog').confirmYes(L('app_not_installed', 'App not installed'), String.format(L('app_install_question', 'Do you want to install %s?'), 'Whatsapp'), function() {
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
			Ti.Android.currentActivity.startActivity(intent, L('Share'));
		} catch (err) {
			require('T/dialog').confirmYes(L('app_not_installed', 'App not installed'), String.format(L('app_install_question', 'Do you want to install %s?'), 'Whatsapp'), function() {
				Util.openInStore('com.whatsapp');
			}, L('install_app', 'Install app'));
		}

		return true;
	}
};


/**
 * @method message
 * Share via Messages
 * @param {Object} args
 */
exports.message = function(args) {
	args = parseArgs(args);

	// iOS Native modal
	if (OS_IOS && benCodingSMS !== null) {
		var $dialog = benCodingSMS.createSMSDialog({ messageBody: args.fullText });
		$dialog.addEventListener('completed', function(){ onSocialComplete({ success: true, platform: 'messages' }); });
		$dialog.addEventListener('cancelled', function(){ onSocialCancel({ success: false, platform: 'messages' }); });
		$dialog.addEventListener('errored', function(){ onSocialComplete({ success: false, platform: 'messages' }); });
		$dialog.open({ animated: true });

		return true;
	}

	// Android Native
	if (OS_ANDROID) {
		var intent = Ti.Android.createIntent({
			action: Ti.Android.ACTION_VIEW,
			type: 'vnd.android-dir/mms-sms',
		});
		intent.putExtra('sms_body', args.fullText);
		Ti.Android.currentActivity.startActivity(intent, L('Share'));

		return true;
	}
};
exports.sms = exports.message;


/**
 * @method activity
 * Share using iOS ActivityPopover or Android Intents
 * @param {Object} args
 */
exports.activity = function(args) {
	args = parseArgs(args);

	// iOS Activity native
	if (OS_IOS && dkNappSocial != null) {
		dkNappSocial[ Util.isIPad() ? 'activityPopover' : 'activityView' ]({
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

		Ti.Android.currentActivity.startActivity(Ti.Android.createIntentChooser(intent, L('Share')));

		return true;
	}
};


/*
Init
*/

// Load modules

var FB = Util.requireOrNull('T/facebook');

if (OS_IOS) {

	var dkNappSocial = Util.requireOrNull('dk.napp.social');
	var benCodingSMS = Util.requireOrNull('bencoding.sms');

	if (benCodingSMS != null) {
		dkNappSocial.addEventListener('complete', onSocialComplete);
		dkNappSocial.addEventListener('cancelled', onSocialCancel);
	}

}
