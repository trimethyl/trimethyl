var callback = null;
if (OS_IOS) {
	var Social = require('dk.napp.social');
	Social.addEventListener('complete', onSocialComplete);
	Social.addEventListener('cancelled', onSocialCancelled);
}

function onSocialComplete(e) {
	if (!callback) return;
	e.type = 'complete';
	if (e.activityName) e.platform = e.activityName;
	callback(e);
}

function onSocialCancelled(e) {
	if (!callback) return;
	e.type = 'cancelled';
	if (e.activityName) e.platform = e.activityName;
	callback(e);
}

function _init(args) {
	args = args || {};
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
		} else if (args.image.indexOf('://')>0) {
			args.imageUrl = args.image;
		}
	}

	if (args.imageUrl && !args.image) {
		args.image = args.imageUrl;
	}
	return args;
}

exports.twitter = function(args, _callback) {
	callback = _callback || null;
	_init(args);

	var webUrl = 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(args.url) + '&text=' + encodeURIComponent(args.text);
	var textUrl = (args.url && args.image) ? (args.text ? args.text + ' ' + args.url : args.url) : args.text;

	if (OS_IOS) {

		if (Social.isTwitterSupported()) {
			Social.twitter({
				text: textUrl,
				image: args.image,
				url: args.url
			});
		} else {
			var url = 'twitter://post?message=' + encodeURIComponent(textUrl);
			if (!Ti.Platform.canOpenURL(url)) url = webUrl;
			Ti.Platform.openURL(url);
		}

	} else if (OS_ANDROID) {

		try {
			var intent = Ti.Android.createIntent({
				action: Ti.Android.ACTION_SEND,
				packageName: "com.twitter.android",
				className: "com.twitter.android.PostActivity",
				type: "text/plain"
			});
			intent.putExtra(Ti.Android.EXTRA_TEXT, textUrl);
			Ti.Android.currentActivity.startActivity(intent);
		} catch (error) {
			Ti.Platform.openURL(webUrl);
		}

	} else {
		Ti.Platform.openURL(webUrl);
	}
};

exports.facebook = function(args, _callback) {
	callback = _callback || null;
	args = _init(args);

	if (OS_IOS && Social.isFacebookSupported() && !args.useSDK) {
		Social.facebook({
			text: args.text,
			image: args.image,
			url: args.url
		});
	} else {

		var FB = require('facebook');
		if (!FB.appid) FB.appid = Ti.App.Properties.getString('ti.facebook.appid', false);

		console.error(args);
		FB.dialog('feed', {
			name: args.title,
			description: args.text,
			picture: args.imageUrl
		}, function(e) {
			if (e.cancelled) {
				onSocialCancelled({
					success: false,
					platform: 'facebook'
				});
			} else {
				onSocialComplete({
					success: e.success,
					platform: 'facebook'
				});
			}
		});
	}
};

exports.mail = function(args, _callback) {
	callback = _callback || null;
	args = _init(args);

	var emailDialog = Ti.UI.createEmailDialog({
		subject: args.subject || '',
		html: true,
		messageBody: args.text + (args.url ? "<br><br>" + args.url : ''),
	});

	if (args.imageBlob) {
		emailDialog.addAttachment(args.imageBlob);
	}

	emailDialog.addEventListener('complete', function(e) {
		if (e.result === this.CANCELLED) {
			onSocialCancelled({
				success: false,
				platform: 'mail'
			});
		} else {
			onSocialComplete({
				success: (e.result === this.SENT),
				platform: 'mail'
			});
		}
	});

	emailDialog.open();
};

exports.options = function(args, _callback) {
	callback = _callback || null;
	args = _init(args);

	if (OS_IOS && Social.isActivityViewSupported()) {

		if (require('util').isIPad()) {
			Social.activityPopover({
				text: args.url ? (args.text ? args.text + ' ' + args.url : args.url) : args.text,
				image: args.image,
				removeIcons: args.removeIcons,
				view: args.view
			}, args.customIcons || []);
		} else {
			Social.activityView({
				text: args.url ? (args.text ? args.text + ' ' + args.url : args.url) : args.text,
				image: args.image,
				removeIcons: args.removeIcons
			}, args.customIcons || []);
		}

	} else if (OS_ANDROID) {

		var intent = Ti.Android.createIntent({ action: Ti.Android.ACTION_SEND });
		if (args.text) intent.putExtra(Ti.Android.EXTRA_TEXT, args.text);
		if (args.text || args.description) intent.putExtra(Ti.Android.EXTRA_SUBJECT, args.description || args.text);
		if (args.image) intent.putExtraUri(Ti.Android.EXTRA_STREAM, args.image);
		var shareActivity = Ti.Android.createIntentChooser(intent, args.titleid ? L(args.titleid, args.title || L('share_title', 'Share')) : (args.title || L('share_title', 'Share')));
		Ti.Android.currentActivity.startActivity(shareActivity);

	} else {

		var options = [];
		var callbacks = [];
		if (!args.removeIcons || args.removeIcons.indexOf('twitter') === -1) {
			options.push('Twitter');
			callbacks.push(_twitter);
		}
		if (!args.removeIcons || args.removeIcons.indexOf('facebook') === -1) {
			options.push('Facebook');
			callbacks.push(_facebook);
		}
		if (!args.removeIcons || args.removeIcons.indexOf('mail') === -1) {
			options.push('Mail');
			callbacks.push(_mail);
		}

		if (args.customIcons) {
			args.customIcons.forEach(function (customIcon) {
				options.push(customIcon.title);
				callbacks.push(customIcon.callback);
			});
		}

		if (options.length === 0) return;
		options.push(L('share_cancel', 'Cancel'));

		var dialog = Ti.UI.createOptionDialog({
			cancel: options.length - 1,
			options: options,
			title: args.title,
			titleid: args.titleid,
			androidView: args.androidView,
			tizenView: args.tizenView
		});

		dialog.addEventListener('click', function(e) {
			if (e.index === e.source.cancel) return;
			callbacks[e.index](args);
		});

		if (require('util').isIPad()) {
			dialog.show({
				animated: args.animated,
				rect: args.rect,
				view: args.view
			});
		} else {
			dialog.show();
		}
	}
};