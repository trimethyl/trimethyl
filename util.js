/**
 * @class  	Util
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Util module.
 *
 * All things that I don't know where to put, are here.
 *
 */

var Dialog = require('T/dialog');


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
	function doFallback() {
		if (fallback != null) {
			if (_.isFunction(fallback)) fallback();
			else if (_.isString(fallback)) Ti.Platform.openURL(fallback);
		} else if (error != null) {
			Dialog.alert(L('Error'), error);
		}
	}

	if (OS_IOS) {
		if (Ti.Platform.canOpenURL(url) === true) {
			Ti.Platform.openURL(url);
		} else {
			doFallback();
		}
	} else if (OS_ANDROID) {
		try {
			Ti.Platform.openURL(url);
		} catch (err) {
			doFallback();
		}
	}
}
exports.openURL = openURL;


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
		if (error != null) {
			Dialog.alert(L('Error'), error);
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
	openURL('fb://profile/' + fbid, 'https://facebook.com/' + fbid);
};


/**
 * @method  openTwitterProfile
 * Open a Twitter profile in the Twitter application
 * @param  {String} twid Twitter screen name
 */
exports.openTwitterProfile = function(twid) {
	return openURL('twitter://user?screen_name=' + twid, 'http://twitter.com/' + twid);
};


/**
 * @method  openTwitterStatus
 * Open a Twitter status in the Twitter application
 * @param  {String} userid   The user id
 * @param  {String} statusid The status id
 */
exports.openTwitterStatus = function(userid, statusid) {
	return openURL('twitter://status?id=' + statusid, 'http://twitter.com/' + userid + '/statuses/' + statusid);
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
	return 'http://graph.facebook.com/' + fbid + '/picture/?width=' + (w || 150) + '&height=' + (h || 150);
};

/**
 * @method openInStore
 * Open the iTunes Store or Google Play Store of specified appid
 * @param {String} appid Application ID
 */
exports.openInStore = function(appid) {
	if (OS_IOS) {
		Ti.Platform.openURL('https://itunes.apple.com/app/id' + appid);
	} else if (OS_ANDROID) {
		Ti.Platform.openURL('https://play.google.com/store/apps/details?id=' + appid);
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
	if (matches == null || matches[1] == null) return '';

	return matches[1].replace('www.', '');
};

/**
 * Return the iOS major version
 * @return {Number}
 */
function getIOSVersion() {
	if (!OS_IOS) return false;
	return parseInt(Ti.Platform.version.split('.')[0], 10);
}
exports.getIOSVersion = getIOSVersion;

/**
 * @method isIOS6
 * Check if is iOS 6
 * @return {Boolean}
 */
exports.isIOS6 = function() {
	return getIOSVersion() === 6;
};

/**
 * @method isIOS7
 * Check if is iOS 7
 * @return {Boolean}
 */
exports.isIOS7 = function() {
	return getIOSVersion() === 7;
};

/**
 * @method isIOS8
 * Check if is iOS 8
 * @return {Boolean}
 */
exports.isIOS8 = function() {
	return getIOSVersion() === 8;
};

/**
 * @method isSimulator
 * Check if current device is a Simulator
 * @return {Boolean}
 */
exports.isSimulator = function() {
	return Ti.Platform.model === 'Simulator' || Ti.Platform.model.indexOf('sdk') !== -1;
};

/**
 * @method isIPad
 * @return {Boolean}
 */
exports.isIPad = function() {
	return Ti.Platform.osname === 'ipad';
};

/**
 * Parse the initial arguments URL schema
 *
 * @return {String}
 */
exports.parseSchema = function() {
	if (OS_IOS) {
		var cmd = Ti.App.getArguments();
		if (cmd.url != null) return cmd.url;
	} else if (OS_ANDROID) {
		var url = Ti.Android.currentActivity.intent.data;
		if (url != null) return url;
	}
	return '';
};


/**
 * @method timestamp
 * Get the UNIX timestamp.
 *
 * @param  {String} [t]  The date to parse. If is not provided, get current timestamp.
 * @return {Number}
 */
function timestamp(t) {
	var ts = new Date(t).getTime() / 1000;
	if (!_.isNumber(ts)) return 0;
	return parseInt(ts, 10);
}
exports.timestamp = timestamp;


/**
 * @method now
 * Get the current UNIX timestamp.
 * @return {Number}
 */
function now() {
	return timestamp(new Date());
}
exports.now = now;


/**
 * @method fromnow
 * Get the UNIX timestamp from now with delay expressed in seconds.
 *
 * @param  {Number} [t]  Seconds from now.
 * @return {Number}
 */
exports.fromnow = function(t) {
	return timestamp( new Date().getTime() + t*1000 );
};

/**
 * @method timestampForHumans
 * Return in human readable format a timestamp
 * @param  {Number} ts The timestamp
 * @return {String}
 */
exports.timestampForHumans = function(ts) {
	var moment = require('T/ext/moment');
	return moment(ts*1000).format();
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
		if (v != null) {
			q.push(k + '=' + encodeURIComponent(v));
		}
	});
	if (q.length === 0) return '';

	return '?' + q.join('&');
};


/**
 * @method  getAppDataDirectory
 * Return the app-data directory.
 *
 * @return {String}
 */
exports.getAppDataDirectory = function() {
	if (Ti.Filesystem.isExternalStoragePresent() === true) {
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
	var telString = tel.match(/[0-9]/g).join('');
	var errString = String.format(L('util_dial_failed'), tel);
	if (OS_IOS) {
		openURL('tel:' + telString, null, errString);
	} else if (OS_ANDROID) {
		startActivity({
			action: Ti.Android.ACTION_CALL,
			data: 'tel:' + telString
		}, errString);
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
exports.isAppFirstUsage = function() {
	return ! Ti.App.Properties.hasProperty('app.firstusage');
};


/**
 * @method setAppFirstUsage
 * Set the app first usage date.
 *
 * Use in conjunction with {@link #isAppFirstUsage}
 *
 */
exports.setAppFirstUsage = function() {
	Ti.App.Properties.setString('app.firstusage', now());
};


/**
 * @method facebookGraphWithAppToken
 * Call the graph using app token.
 *
 * @param  {String}   path     The path for the open graph request.
 * @param  {Object}   object   The data for the open graph request.
 * @param  {Object}   opt      The options.
 * Required options are:
 * * **appid**: Application ID
 * * **appsecret**: Application secret
 * * **[expire]**: Cache the request for specified seconds.
 * * **[error]**: Error callback
 * @param  {Function} callback Success callback
 */
exports.facebookGraphWithAppToken = function(path, obj, opt, callback) {
	obj = obj || {};
	obj.access_token = opt.appid + '|' + opt.appsecret;

	require('T/http').send({
		url: 'https://graph.facebook.com/' + path.replace(/^\//, ''),
		data: obj,
		format: 'json',
		refresh: opt.refresh,
		expire: opt.expire,
		silent: opt.silent,
		error: opt.error,
		success: callback
	});
};


var XCU = {
	key: ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'],
	q: {
		name: 'queryKey',
		parser: /(?:^|&)([^&=]*)=?([^&]*)/g
	},
	parser: {
		strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
		loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
	}
};

/**
 * @method parseAsXCallbackURL
 * @param  {String} 	url  The URL to parse
 * @return {XCallbackURL}
 */
exports.parseAsXCallbackURL = function(str) {
	var m = XCU.parser.strict.exec(str);
	var i = XCU.key.length;
	var uri = {};

	while (i--) uri[XCU.key[i]] = m[i] || '';
	uri[XCU.q.name] = {};
	uri[XCU.key[12]].replace(XCU.q.parser, function($0, $1, $2) {
		if ($1) uri[XCU.q.name][$1] = $2;
	});

	return uri;
};

/**
 * @method hashJavascriptObject
 * Return the seralized representation of any JS object.
 * @param  {Object} obj
 * @return {String) The hash
 */
exports.hashJavascriptObject = function(obj) {
	if (obj == null) return 'null';
	if (_.isArray(obj)) return JSON.stringify(obj);
	if (_.isObject(obj)) {
		var keys = _.keys(obj).sort();
		return JSON.stringify(_.object(keys, _.map(keys, function (key) { return obj[key]; })));
	}
	return obj.toString();
};
