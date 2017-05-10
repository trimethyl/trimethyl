/**
 * @module 	util
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var Permissions = require('T/permissions/phone');

/**
 * Require a module, or return a null object
 * @param  {String} name
 * @return {Object}
 */
exports.requireOrNull = function(name) {
	try {
		return require(name) || null;
	} catch (ex) {
		return null;
	}
};

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
exports.openURL = function(url, fallback, error) {
	var doFallback = function() {
		if (fallback != null) {
			if (_.isFunction(fallback)) {
				fallback();
			} else if (_.isString(fallback)) {
				Ti.Platform.openURL(fallback);
			}
		} else if (error != null) {
			exports.errorAlert(error);
		}
	};

	if (OS_IOS) {
		if (Ti.Platform.canOpenURL(url)) {
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
};

/**
 * @param  {String} url
 */
exports.openHTTPLink = function(url) {
	if (OS_IOS) {

		var SD = exports.requireOrNull('ti.safaridialog');

		if (SD != null && SD.isSupported()) {
			SD.open({ url:url });

			return SD;
		} else {
			require('T/dialog').confirmYes(L('confirm_openlink_leave_app', 'Leave application?'), L('confirm_openlink_browser_alert', 'The link will be open in the browser'), function() {
				Ti.Platform.openURL(url);
			}, L('yes', 'Yes'));
		}

	} else {
		Ti.Platform.openURL(url);
	}
};

/**
 * Try to open all URLs in the array
 * @param  {Array} urls
 * @return {Boolean} `true` if at least one url has been opened.
 */
exports.tryOpenURLs = function(urls) {
	for (var i = 0; i < urls.length; i++) {
		try {
			if (OS_IOS) {
				if (Ti.Platform.canOpenURL(urls[i])) {
					Ti.Platform.openURL(urls[i]);
				} else {
					throw new Error();
				}
			} else if (OS_ANDROID) {
				if (!Ti.Platform.openURL(urls[i])) throw new Error();
			}

			return true;
		} catch (err) {}
	}

	return false;
};

/**
 * Valid only on Android, start the activity catching any possible errors.
 *
 * If `error` is provided, show the error dialog with this message.
 *
 * @param  {Object} opt   		Options for `createIntent(...)`
 * @param  {String} [error] 	Error message
 */
exports.startActivity = function(opt, error) {
	try {
		Ti.Android.currentActivity.startActivity(Ti.Android.createIntent(opt));
	} catch (ex) {
		if (error != null) {
			exports.errorAlert(error);
		}
	}
};

/**
 * Open a Facebook profile in the Facebook application
 * @param  {String} fb_id 	Facebook ID
 */
exports.openFacebookProfile = function(fb_id) {
	if (!/^\d+$/.test(fb_id)) {
		Ti.API.warn('Util: openFacebookProfile needs a numeric ID, not the username');
	}

	return exports.tryOpenURLs([
		'fb://profile/' + fb_id,
		'https://www.facebook.com/' + fb_id
	]);
};

/**
 * Open a Twitter profile in the Twitter application
 * @param  {String} tw_username 	Twitter screen name
 */
exports.openTwitterProfile = function(tw_username) {
	if (OS_IOS) {
		return exports.tryOpenURLs([
			'tweetbot:///user_profile/' + tw_username,
			'twitter://user?screen_name=' + tw_username,
			'http://www.twitter.com/' + tw_username
		]);
	} else {
		// There's a bug in the Twitter app for Android that blocks requests if the app is still closed
		return Ti.Platform.openURL('http://www.twitter.com/' + tw_username);
	}
};

/**
 * Open a Twitter status in the Twitter application
 * @param  {String} tw_username   	The user id
 * @param  {String} status_id 		The status id
 */
exports.openTwitterStatus = function(tw_username, status_id) {
	return exports.tryOpenURLs([
		'twitter://status?id=' + status_id,
		'http://www.twitter.com/' + tw_username + '/statuses/' + status_id
	]);
};

/**
 * Open a Youtube profile in the Yotube application
 * @param  {String} ytid 	Youtube ID
 */
exports.openYoutubeProfile = function(ytid) {
	return Ti.Platform.openURL('https://www.youtube.com/user/' + ytid);
};

/**
 * Open an Instagram profile in the Instagram application
 * @param  {String} ig_username 	The user's id
 */
exports.openInstagramProfile = function(ig_username) {
	return exports.tryOpenURLs([
		'instagram://user?username=' + ig_username,
		'http://www.instagram.com/' + ig_username
	]);
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
 * Open the iTunes Store or Google Play Store of specified appid
 * @property appid The appid
 */
exports.openInStore = function(appid) {
	if (OS_IOS) {
		Ti.Platform.openURL('https://itunes.apple.com/app/id' + appid);
	} else if (OS_ANDROID) {
		Ti.Platform.openURL('https://play.google.com/store/apps/details?id=' + appid);
	}
};

/**
 * Return the clean domain of an URL
 *
 * @param  {String} url The URL to parse
 * @return {String}     Clean domain
 */
exports.getDomainFromURL = function(url) {
	var matches = url.match(/^.+\:\/\/([^\/]+)/);
	if (matches == null || matches[1] == null) return '';
	return matches[1];
};

/**
 * Returns the build type. It differs from Ti.Platform.deployType, as it returns "development" both for "test" and "development" builds.
 * @return {String}
 */
exports.getDeployType = function() {
	return Ti.App.deployType === 'production' ? 'production' : 'development';
};

/**
 * Returns the OS name. It differs from Ti.Platform.osname, as it returns "ios" both for iPhone and iPad.
 * @return {String}
 */
exports.getOS = function() {
	var name = Ti.Platform.osname;
	return (name == 'iphone' || name == 'ipad') ? 'ios' : name;
};

/**
 * Return the iOS major version
 * @return {Number}
 */
exports.getIOSVersion = function() {
	if (!OS_IOS) return 0;
	return Ti.Platform.version.split('.')[0] >> 0;
};

/**
 * Check if is iOS 6
 * @return {Boolean}
 */
exports.isIOS6 = function() {
	return exports.getIOSVersion() === 6;
};

/**
 * Check if is iOS 7
 * @return {Boolean}
 */
exports.isIOS7 = function() {
	return exports.getIOSVersion() === 7;
};

/**
 * Check if is iOS 8
 * @return {Boolean}
 */
exports.isIOS8 = function() {
	return exports.getIOSVersion() === 8;
};

/**
 * Check if is iOS 9
 * @return {Boolean}
 */
exports.isIOS9 = function() {
	return exports.getIOSVersion() === 9;
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
	return null;
};

/**
 * Get the UNIX timestamp.
 *
 * @param  {Object} [arg]  The date to parse.
 * @return {Number}
 */
exports.timestamp = function(arg) {
	if (arg == null) return exports.now();
	return (new Date(arg).getTime() / 1000) >> 0;
};

/**
 * Get the current UNIX timestamp.
 * @return {Number}
 */
exports.now = function() {
	return (Date.now() / 1000) >> 0;
};

/**
 * Get the UNIX timestamp from now with delay expressed in seconds.
 *
 * @param  {Number} [t]  Seconds from now.
 * @return {Number}
 */
exports.fromNow = function(t) {
	return exports.timestamp(Date.now() + t*1000);
};

/**
 * Return in human readable format a timestamp
 * @param  {Number} ts The timestamp
 * @return {String}
 */
exports.timestampForHumans = function(ts) {
	return require('alloy/moment')(ts*1000).format();
};

/**
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
 * Generate URL-encoded query string.
 *
 * @param {Object} obj 			Object key-value to parse.
 * @param {String} prepend 	The prepended char
 * @return {String}
 */
exports.buildQuery = function(obj, prepend) {
	if (_.isEmpty(obj)) return '';

	var q = [];
	var builder = function(value, key) {
		if (value === null || value === undefined) return;

		if (_.isArray(value)) {
			_.each(value, function(v) { builder(v, key+'[]'); });
		} else if (_.isObject(value)) {
			_.each(value, function(v, k) { builder(v, key+'['+k+']'); });
		} else {
			q.push( encodeURIComponent(key) + '=' + encodeURIComponent(value) );
		}
	};

	_.each(obj, builder);
	return q.length === 0 ? '' : ((prepend != null ? prepend : '?') + q.join('&'));
};

var APPDATA_DIRECTORY = null;

/**
 * Return the app-data directory.
 *
 * @return {String}
 */
exports.getAppDataDirectory = function() {
	if (APPDATA_DIRECTORY === null) {
		if (OS_IOS) {
			APPDATA_DIRECTORY = Ti.Filesystem.applicationSupportDirectory;
		} else if (OS_ANDROID) {
			APPDATA_DIRECTORY = Ti.Filesystem.getFile(Ti.Filesystem[ Ti.Filesystem.isExternalStoragePresent() ? 'externalStorageDirectory' : 'applicationDataDirectory' ]).nativePath + "/";
		} else {
			APPDATA_DIRECTORY = Ti.Filesystem.applicationDataDirectory;
		}
		// Why this?
		// Because sometimes this directory doesn't exists,
		// so with this wrap we are sure that the directory will exists.
		try { Ti.Filesystem.getFile(APPDATA_DIRECTORY).createDirectory(); } catch (err) {}
	}
	return APPDATA_DIRECTORY;
};

/**
 * Dial a number.
 *
 * @param  {String} tel The number to call.
 */
exports.dial = function(tel) {
	var telString = tel.match(/[0-9]/g).join('');
	var errString = String.format(L('unable_to_call', 'Unable to call %s'), tel);
	if (OS_IOS) {
		exports.openURL('tel:' + telString, null, errString);
	} else if (OS_ANDROID) {
		Permissions.request(function() {
			exports.startActivity({
				action: Ti.Android.ACTION_CALL,
				data: 'tel:' + telString
			}, errString);
		}, function() {
			exports.errorAlert(errString);
		});
	}
};

var XCU = {
	key: ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'],
	parser: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
	queryParser: function(params) {
		var obj = {};

		_.each(params.replace(/\+/g, ' ').split('&'), function (v,j) {
			var param = v.split('=');
			var key = decodeURIComponent(param[0]);
			var val, cur = obj, i = 0;

			var keys = key.split(']['), keys_last = keys.length - 1;

			if (/\[/.test(keys[0]) && /\]$/.test(keys[keys_last])) {
				keys[ keys_last ] = keys[ keys_last ].replace( /\]$/, '' );
				keys = keys.shift().split('[').concat( keys );
				keys_last = keys.length - 1;
			} else {
				keys_last = 0;
			}

			if (param.length === 2) {
				val = decodeURIComponent(param[1]);

				if (keys_last) {
					for (; i <= keys_last; i++) {
						key = keys[i] === '' ? cur.length : keys[i];
						cur = cur[key] = i < keys_last ? cur[key] || ( keys[i+1] && isNaN( keys[i+1] ) ? {} : [] ) : val;
					}
				} else {
					if (_.isArray(obj[key])) {
						obj[key].push( val );
					} else if ({}.hasOwnProperty.call(obj, key)) {
						obj[key] = [ obj[key], val ];
					} else {
						obj[key] = val;
					}
				}
			} else if (key) {
				obj[key] = '';
			}
		});

		return obj;
	}
};


/**
 * @param  {String} 	url  The URL to parse
 * @return {XCallbackURL}
 */
exports.parseAsXCallbackURL = function(str) {
	var uri = {};

	var m = XCU.parser.exec(str);
	var i = XCU.key.length;
	while (i--) uri[XCU.key[i]] = m[i] || '';

	uri.queryKey = XCU.queryParser(uri.query);

	return uri;
};

// The next two methods are taken from https://gist.github.com/CatTail/4174511
// Many thanks to CatTail!
/**
 * Decode html entities into text
 * @param  {String} str The string to decode
 * @return {String} 	The decoded string
 */
exports.decodeHtmlEntity = function(str) {
	return str.replace(/&#(\d+);/g, function(match, dec) {
		return String.fromCharCode(dec);
	});
};

/**
 * Encode a string into html entities
 * @param  {String} str The string to encode
 * @return {String} 	The encoded string
 */
exports.encodeHtmlEntity = function(str) {
	var buf = [];
	for (var i=str.length-1;i>=0;i--) {
		buf.unshift(['&#', str[i].charCodeAt(), ';'].join(''));
	}
	return buf.join('');
};

/**
 * Return the seralized representation of any JS object.
 * @param  {Object} obj
 * @return {String} The hash
 */
exports.hashJavascriptObject = function(obj) {
	if (obj == null) return 'null';
	if (_.isArray(obj) || _.isObject(obj)) return JSON.stringify(obj);
	return obj.toString();
};

/**
 * An error parser that parse a String/Object
 */
exports.getErrorMessage = function(obj, def) {
	if (_.isObject(obj)) {
		if (_.isString(obj.message)) {
			return obj.message;
		} else if (_.isObject(obj.error) && _.isString(obj.error.message)) {
			return obj.error.message;
		} else if (_.isString(obj.error)) {
			return obj.error;
		}
	} else if (!_.isEmpty(obj)) {
		return obj.toString();
	}

	if (def != null) return def;
	
	return L('unexpected_error', 'Unexpected error');
};

/**
 * @param  {Object}   err      		The object error
 * @param  {Function} [callback] 	The callback
 */
exports.errorAlert = function(err, callback) {
	require('T/dialog').alert(L('error', 'Error'), exports.getErrorMessage(err), callback);
};

/**
 * @method alertError
 * @see {@link errorAlert}
 */
exports.alertError = exports.errorAlert;


/**
 * Get a human representation of bytes
 * @param  {Number} bytes
 * @return {String}
 */
exports.bytesForHumans = function(bytes) {
	var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	if (bytes === 0) return 'n/a';
	var i = parseInt(Math.floor(Math.log(bytes)/Math.log(1024)));
	return Math.round(bytes/Math.pow(1024,i),2) + ' ' + sizes[i];
};

var DATABASE_DIRECTORY = null;

/**
 * Get the private documents directory
 * @return {String}
 */
exports.getDatabaseDirectoryName = exports.getDatabaseDirectory = function() {
	if (DATABASE_DIRECTORY === null) {
		var db = require('T/db').open('test');
		var path = db.file.resolve().split('/'); path.pop();
		db.close();
		DATABASE_DIRECTORY = path.join('/') + '/';
	}
	return DATABASE_DIRECTORY;
};

/**
 * Get the resources directory path
 * @return {String}
 */
exports.getResourcesDirectory = function() {
	if (OS_IOS) {
		if (Ti.Shadow) {
			return Ti.Filesystem.applicationDataDirectory + Ti.App.name + '/iphone/';
		} else {
			return Ti.Filesystem.resourcesDirectory;
		}
	} else {
		return Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "").nativePath + (Ti.Shadow ? "/" : "");
	}
};


/**
 * Compare two app versions
 * @param  {String} a
 * @param  {String} b
 * @return {Number}
 */
exports.compareVersions = function(a, b) {
	if (a == null || b == null) return 0;

	a = a.split('.');
	b = b.split('.');
	for (var i = 0; i < Math.max(a.length, b.length); i++) {
		var _a = +a[i] || 0, _b = +b[i] || 0;
		if (_a > _b) return 1;
		else if (_a < _b) return -1;
	}
	return 0;
};

/**
 * Add leading zeros
 * @param  {String} num  The number
 * @param  {Number} size The final size
 * @return {String}
 */
exports.zeroPad = function(num, size) {
	if (num == null) return num;

	var result = num.toString();
	while (result.length < (size || 2)) result = '0' + result;
	return result;
};

/**
 * Get a UUID
 * @return {String}
 */
exports.guid = function() {
	return Ti.Platform.createUUID();
};

/**
 * Get the full platform name
 * @return {String}
 */
exports.getPlatformFullName = function() {
	return Ti.Platform.model + ' - ' + Ti.Platform.osname + ' ' + Ti.Platform.version + ' (' + Ti.Platform.ostype + ') - ' + Ti.Platform.locale;
};

/**
 * Get the rot13 of a string
 * @param  {String} s
 */
exports.rot13 = function(s) {
	return s.replace(/[a-zA-Z]/g,function(c){return String.fromCharCode((c<="Z"?90:122)>=(c=c.charCodeAt(0)+13)?c:c-26);});
};