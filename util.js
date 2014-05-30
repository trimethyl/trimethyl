/**
 * @class  	Util
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Util module.
 *
 * All things that I don't know where to put, are here.
 *
 */


/**
 * Try to open the URL with `Ti.Platform.openURL`, catching errors.
 *
 * If can't open the primary argument (url), open the fallback.
 *
 * If can't open the fallback, and `error` is set, show the error dialog.
 *
 * @param  {String} url The URL to open
 * @param  {String|Function} [fallback] If is a string, try to open the URL. If is a functions, call it.
 * @param  {String} [error]    The error to show
 */
function openURL(url, fallback, error) {
	if (OS_IOS && Ti.Platform.canOpenURL(url)) {
		try {
			Ti.Platform.openURL(url);
		} catch (e) {}
	} else if (fallback) {
		if (_.isFunction(fallback)) {
			fallback();
		} else {
			try {
				Ti.Platform.openURL(fallback);
			} catch (e) {}
		}
	} else if (error) {
		alertError(error);
	}
}
exports.openURL = openURL;


/**
 * Try to open a series of URLs, cycling over all while a valid URL is found.
 *
 * On Android, open the last element of the array.
 *
 * @param  {Array} array The array of URLs
 */
function tryOpenURL(array) {
	if (OS_IOS) {
		for (var k in array) {
			if (Ti.Platform.canOpenURL(array[k])) {
				Ti.Platform.openURL(array[k]);
				return;
			}
		}
	} else {
		Ti.Platform.openURL(array.pop());
	}
}
exports.tryOpenURL = tryOpenURL;


/**
 * Valid only on Android, start the activity catching any possible errors.
 *
 * If `error` is provided, show the error dialog with this message.
 *
 * @param  {Object} opt   Options for `createIntent(...)`
 * @param  {String} [error] Error message
 */
function startActivity(opt, error) {
	try {
		Ti.Android.currentActivity.startActivity(Ti.Android.createIntent(opt));
	} catch (ex) {
		if (error) {
			alertError(error);
		}
	}
}
exports.startActivity = startActivity;


/**
 * @method  openFacebookProfile
 * Open a Facebook profile in the Facebook application
 * @param  {String} fbid Facebook ID
 */
exports.openFacebookProfile = function(fbid) {
	openURL("fb://profile/"+fbid, "https://facebook.com/"+fbid);
};


/**
 * @method  openTwitterProfile
 * Open a Twitter profile in the Twitter application
 * @param  {String} twid Twitter screen name
 */
exports.openTwitterProfile = function(twid) {
	return openURL("twitter://user?screen_name="+twid, "http://twitter.com/"+twid);
};


/**
 * Get the Facebook avatar from the graph
 *
 * @param  {String} fbid Facebook ID
 * @param  {Number} [w]    Width
 * @param  {Number} [h]    Height
 * @return {String}      	The open graph url pointing to the image
 */
exports.getFacebookAvatar = function(fbid, w, h) {
	return 'http://graph.facebook.com/'+fbid+'/picture/?width='+(w||150)+'&height='+(h||150);
};


/**
 * @method reviewInStore
 * Open the iTunes Store or Google Play Store to review this app
 *
 * Set the `app.itunes` and `app.id` in the **config.json**
 *
 */
exports.reviewInStore = function() {
	if (OS_IOS) {
		Ti.Platform.openURL('itms-apps://itunes.apple.com/app/id'+Alloy.CFG.app.itunes);
	} else if (OS_ANDROID) {
		Ti.Platform.openURL('https://play.google.com/store/apps/details?id='+Alloy.CFG.app.id+'&reviewId=0');
	}
};


/**
 * @method  getDomainFromURL
 * Return the clean domain of an URL
 *
 * @param  {String} url The URL to parse
 * @return {String}     Clean domain
 */
exports.getDomainFromURL = function(url) {
	var matches = url.match(/https?\:\/\/([^\/]*)/i);
	if (!matches) return '';
	return matches[1].replace('www.', '');
};


/**
 * @method alert
 * Create and show an Alert Dialog
 *
 * @param  {String}   title    The title
 * @param  {String}   msg      The message
 * @param  {Function} [callback] The callback to invokie when clicking **OK**
 * @return {Ti.UI.AlertDialog}
 */
function alertDialog(title, msg, callback) {
	var dialog = Ti.UI.createAlertDialog({
		title: title,
		message: msg,
		ok: L('OK')
	});
	if (callback) dialog.addEventListener('click', callback);
	dialog.show();
	return dialog;
}
exports.alert = alertDialog;


/**
 * @method prompt
 * Create and show a prompt dialog
 *
 * @param  {String}   title       	The title
 * @param  {String}   msg         	The message
 * @param  {Array}    [buttons]     The buttons to show
 * @param  {Number}   [cancelIndex] Cancel index for buttons
 * @param  {Function} [callback]    The callback to invoke when clicking on a button. The index of the button is passed.
 * @param  {Object}   [opt]         Additional options for `Ti.UI.createAlertDialog`
 * @return {Ti.UI.AlertDialog}
 */
function alertPrompt(title, msg, buttons, cancelIndex, callback, opt) {
	var dialog = Ti.UI.createAlertDialog(_.extend({
		cancel: cancelIndex,
		buttonNames: buttons,
		message: msg,
		title: title
	}, opt || {}));
	dialog.addEventListener('click', function(e){
		if (OS_IOS && e.index==cancelIndex) return;
		if (OS_ANDROID && e.cancel) return;
		if (callback) callback(e.index);
	});
	dialog.show();
	return dialog;
}
exports.prompt = alertPrompt;


/**
 * @method confirm
 * Create and show a confirm dialog with *Cancel* and *Yes* button.
 *
 * @param  {String}   title 		The title
 * @param  {String}   msg   		The message
 * @param  {Function} [cb]    	The callback to invoke when clicking *Yes*.
 * @return {Ti.UI.AlertDialog}
 */
exports.confirm = function(title, msg, cb) {
	return alertPrompt(title, msg, [ L('Cancel'), L('Yes') ], 0, cb, { selectedIndex: 1 });
};


/**
 * @method  confirmCustom
 * Create and show a confirm dialog with *Cancel* and a custom button.
 *
 * @param  {String}   	title 		The title
 * @param  {String}   	msg   		The message
 * @param  {String}   	btnTitle 	The custom button title
 * @param  {Function} 	[cb]    		The callback to invoke when clicking your custom button title.
 * @return {Ti.UI.AlertDialog}
 */
exports.confirmCustom = function(title, msg, btnTitle, cb) {
	return alertPrompt(title, null, [ L('Cancel'), btnTitle ], 0, cb, { selectedIndex: 1 });
};


/**
 * @method  option
 * Create and show an Option Dialog.
 *
 * @param  {Array}   	options     	The options to show, as Array of Strings.
 * @param  {Number}   	cancelIndex 	The cancelIndex.
 * @param  {Function} 	callback    	Callback to invoke. The index of the selected index is passed.
 * @param  {Object}   	opt         	Additionals options for `Ti.UI.createOptionDialog`
 * @return {Ti.UI.OptionDialog}
 */
function optionDialog(options, cancelIndex, callback, opt) {
	if (OS_ANDROID && cancelIndex>=0) { options.splice(cancelIndex,1); }
	var dialog = Ti.UI.createOptionDialog(_.extend({
		options: options,
		cancel: cancelIndex
	}, opt || {}));
	dialog.addEventListener('click', function(e){
		if (OS_IOS && e.index==cancelIndex) return;
		if (OS_ANDROID && e.cancel) return;
		if (callback) callback(e.index);
	});
	dialog.show();
	return dialog;
}
exports.option = optionDialog;


/**
 * @method optionWithDict
 * Create and show an Option Dialog.
 *
 * It's an helper function for @{@link #option} method.
 *
 * Automatically add a *Cancel* cancelIndexed button.
 *
 * The `dict` argument must be in the form:
 *
 * ```javascript
 * [
 * 	{ title: "Option one", callback: function(){ ... } },
 * 	{ title: "Option two", callback: function(){ ... } },
 * 	...
 * ]
 * ```
 *
 * @param  {Array} 	dict 	The dictionary
 * @return {Ti.UI.OptionDialog}
 */
function optionDialogWithDict(dict) {
	var options = _.pluck(dict, 'title');
	options.push(L('Cancel'));
	return optionDialog(options, options.length-1, function(i){
		if (dict[+i] && dict[+i].callback) dict[+i].callback();
	});
}
exports.optionWithDict = optionDialogWithDict;


/**
 * Show an Error Dialog.
 *
 * The title is automatically *Error*, i18n compatible.
 *
 * @param  {String}   msg      		The message
 * @param  {Function} [callback] 	The callback to invoke.
 * @return {Ti.UI.AlertDialog}
 */
function alertError(msg, callback) {
	return alertDialog(L('Error', 'Error'), msg, callback);
}
exports.alertError = exports.error = alertError;


/**
 * Check if is iOS 7
 * @return {Boolean}
 */
function isIOS7() {
	return OS_IOS && +(Ti.Platform.version.split(".")[0])>=7;
}
exports.isIOS7 = isIOS7;


/**
 * Parse the URL schema on app startup/resume.
 * @return {String}
 */
exports.parseSchema = function() {
	if (OS_IOS) {
		var cmd = Ti.App.getArguments();
		if (cmd && 'url' in cmd) {
			return cmd.url.replace(/[^:]*\:\/\//, '');
		}
	} else if (OS_ANDROID) {
		var url = Ti.Android.currentActivity.intent.data;
		if (url) {
			return url.replace(/[^:]*\:\/\//, '');
		}
	}

	return '';
};


/**
 * @method  uniqid
 * View [link](http://www.php.net/manual/en/function.uniqid.php)
 * @return {String}
 */
exports.uniqid = function(prefix, more_entropy) {
	if (typeof prefix === 'undefined') {
		prefix = '';
	}

	var retId;
	var formatSeed = function (seed, reqWidth) {
		seed = parseInt(seed, 10) .toString(16);
		if (reqWidth < seed.length) {
			return seed.slice(seed.length - reqWidth);
		}
		if (reqWidth > seed.length) {
			return Array(1 + (reqWidth - seed.length)).join('0') + seed;
		}
		return seed;
	};

	if (!this.php_js) {
		this.php_js = {};
	}
	if (!this.php_js.uniqidSeed) {
		this.php_js.uniqidSeed = Math.floor(Math.random() * 0x75bcd15);
	}
	this.php_js.uniqidSeed++;

	retId = prefix;
	retId += formatSeed(parseInt(new Date()
	.getTime() / 1000, 10), 8);
	retId += formatSeed(this.php_js.uniqidSeed, 5);
	if (more_entropy) {
		retId += (Math.random() * 10)
		.toFixed(8)
		.toString();
	}

	return retId;
};


/**
 * @method timestamp
 * Get the UNIX timestamp.
 *
 * @param  {String} [t]  The date to parse. If is not provided, get current timestamp.
 * @return {Number}
 */
exports.timestamp = function(t){
	if (t) return parseInt(+new Date(t)/1000, 10);
	return parseInt(+new Date()/1000, 10);
};


/**
 * @method parseJSON
 * Try to parse a JSON, and silently fail on error, returning a `null` in this case.
 *
 * @param  {String} json 		The JSON to parse.
 * @return {Object}
 */
exports.parseJSON = function(json) {
	try {
		return JSON.parse(json) || null;
	} catch (ex) {
		return null;
	}
};


/**
 * @method buildQuery
 * Generate URL-encoded query string.
 *
 * @param  {Object} obj Object key-value to parse.
 * @return {String}
 */
exports.buildQuery = function(obj) {
	if (_.isEmpty(obj)) return '';
	var q = [];
	_.each(obj, function(v, k) {
		if (v!==null && v!==false && v!==undefined) {
			q.push(k+'='+encodeURIComponent(v));
		}
	});
	if (!q.length) return '';
	return '?' + q.join('&');
};


/**
 * @method  getAppDataDirectory
 * Return the app-data directory.
 *
 * @return {String}
 */
exports.getAppDataDirectory = function() {
	if (Ti.Filesystem.isExternalStoragePresent()) {
		return Ti.Filesystem.externalStorageDirectory;
	}
	return Ti.Filesystem.applicationDataDirectory;
};


/**
 * @method  dialog
 * Dial a number.
 *
 * @param  {String} tel The number to call.
 */
exports.dial = function(tel) {
	tel = tel.match(/[0-9]/g).join('');
	if (OS_ANDROID) {

		startActivity({
			action: Ti.Android.ACTION_CALL,
			data: 'tel:'+tel
		}, String.format(L('util_dial_failed'), tel));

	} else {
		openURL('tel:'+tel, null, String.format(L('util_dial_failed'), tel));
	}
};


/**
 * @method isAppFirstUsage
 * Check if the first open of the app.
 *
 * Call @{@link #setAppFirstUsage} to set the first usage of the app.
 *
 * @return {Boolean}
 */
exports.isAppFirstUsage = function(){
	return !Ti.App.Properties.hasProperty('app.firstusage');
};


/**
 * @method setAppFirstUsage
 * Set the app first usage date.
 *
 * Use in conjunction with {@link #isAppFirstUsage}
 *
 */
exports.setAppFirstUsage = function(){
	Ti.App.Properties.setString('app.firstusage', +new Date().toString());
};


/**
 * @method populateListViewFromCollection
 * Parse an array or a Backbone.Collection and populate a ListView with this values.
 *
 * @param  {Array} C   	Array or Backbone.Collection to parse
 * @param  {Object} opt
 *
 * If `groupBy` is specified, and is a function, you must provide a valid callback to group elements.
 *
 * If `groupBy` is a string, try to group with `_.groupBy`.
 *
 * @param  {Ti.UI.ListView} [$ui]
 * The ListView to populate. If is not specified, return the elements instead populating directly.
 *
 * @return {Array}
 */
exports.populateListViewFromCollection = function(C, opt, $ui) {
	var array = [];
	var sec = [];

	if (opt.groupBy) {

		if (_.isFunction(opt.groupBy)) {
			if (C instanceof Backbone.Collection) array = C.groupBy(opt.groupBy);
			else array = _.groupBy(C, opt.groupBy);
		} else {
			array = C;
		}

		_.each(array, function(els, key){
			var dataset = [];
			_.each(els, function(el){
				dataset.push(opt.datasetCb(el));
			});

			var s = Ti.UI.createListSection({ items: dataset });
			if (opt.headerViewCb) s.headerView = opt.headerViewCb(key);
			else s.headerTitle = key;

			sec.push(s);
		});

		if ($ui && opt.sectionIndex) {
			var sit = [];
			_.each(_.keys(array), function(u,k){
				sit.push({ title: u, index: k });
			});
			$ui.sectionIndexTitles = sit;
		}

	} else {

		if (C instanceof Backbone.Collection) array = C.toJSON();
		else array = C;

		var dataset = [];
		_.each(array, function(el){
			dataset.push(opt.datasetCb(el));
		});

		sec = [ Ti.UI.createListSection({ items: dataset }) ];
	}

	if ($ui) $ui.sections = sec;
	else return sec;
};