/**
 * @module  auth
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {String} [config.loginUrl="/login"] The URL called by login().
 * @property {String} [config.logoutUrl="/logout"] The URL called by logout().
 * @property {Boolean} [config.ignoreServerModelId=false] Force the module to use the configured modelId to fetch and store the user model.
 * @property {String} [config.modelId="me"] The id for the user model.
 * @property {Boolean} [config.useOAuth=false] Use OAuth method to authenticate.
 * @property {String} [config.oAuthAccessTokenURL="/oauth/access_token"] OAuth endpoint to retrieve access token.
 * @property {Boolean} [config.useTouchID=false] Use TouchID to protected stored/offline login.
 * @property {Boolean} [config.useTouchIDPromptConfirmation=false] Ask the user if he wants to use the TouchID protection. If false, the TouchID protection is used without prompts.
 */
exports.config = _.extend({
	loginUrl: '/login',
	logoutUrl: '/logout',
	modelId: 'me',
	ignoreServerModelId: false,
	useOAuth: false,
	oAuthAccessTokenURL: '/oauth/access_token',
	useTouchID: false,
	useTouchIDPromptConfirmation: false
}, Alloy.CFG.T ? Alloy.CFG.T.auth : {});

var MODULE_NAME = 'auth';

var Q = require('T/ext/q');
var HTTP = require('T/http');
var Event = require('T/event');
var Cache = require('T/cache');
var Util = require('T/util');
var Dialog = require('T/dialog');

var Securely = Util.requireOrNull('bencoding.securely');
var TouchID = Util.requireOrNull("ti.touchid");

/**
 * OAuth object instance of oauth module
 * @see  support/oauth
 * @type {Object}
 */
exports.OAuth = OAuth;

/**
 * User model object
 * Don't rely direcly on this property but use {@link getUser) instead
 * @type {Backbone.Model}
 */
exports.me = null;

////////////
// Driver //
////////////

function getStoredDriverString() {
	var hasDriver = authProperties.hasProperty('auth.driver');
	var hasMe = authProperties.hasProperty('auth.me');
	if (hasDriver && hasMe) {
		return authProperties.getString('auth.driver');
	}
}

function driverLogin(opt) {
	var driver = exports.loadDriver(opt.driver);
	var method = opt.stored === true ? 'storedLogin' : 'login';

	return Q.promise(function(resolve, reject) {
		driver[ method ]({
			data: opt.data,
			success: resolve,
			error: reject
		});
	});
}


///////////////////////
// Server side login //
///////////////////////

function serverLoginWithOAuth(opt, dataFromDriver) {
	var oAuthPostData = {
		client_id: OAuth.getClientID(),
		client_secret: OAuth.getClientSecret(),
		grant_type: 'password',
		username: '-',
		password: '-'
	};

	return Q.promise(function(resolve, reject) {
		HTTP.send({
			url: exports.config.oAuthAccessTokenURL,
			method: 'POST',
			data: _.extend({}, oAuthPostData, dataFromDriver),
			suppressFilters: ['oauth'],
			success: function(data) {
				OAuth.storeCredentials(data);
				resolve(data);
			},
			error: reject,
		});
	});
}

function serverLoginWithCookie(opt, dataFromDriver) {
	return Q.promise(function(resolve, reject) {
		HTTP.send({
			url: opt.loginUrl,
			method: 'POST',
			data: dataFromDriver,
			success: function(data) {
				HTTP.exportCookiesToSystem();
				resolve(data);
			},
			error: reject,
		});
	});
}

function apiLogin(opt, dataFromDriver) {
	var driver = exports.loadDriver(opt.driver);
	opt.loginUrl = driver.config.loginUrl || exports.config.loginUrl;

	if (exports.config.useOAuth == true) {
		return serverLoginWithOAuth(opt, dataFromDriver);
	} else {
		return serverLoginWithCookie(opt, dataFromDriver);
	}
}

//////////////////////
// Fetch user model //
//////////////////////

function fetchUserModel(opt, dataFromServer) {
	dataFromServer = dataFromServer || {};
	return Q.promise(function(resolve, reject) {
		var id = exports.config.modelId;

		if (exports.config.ignoreServerModelId == false && dataFromServer.id != null) {
			id = dataFromServer.id;
		}

		exports.me = Alloy.createModel('user', { id: id });
		exports.me.fetch({
			http: {
				refresh: true,
				cache: false,
			},
			success: function() {
				authProperties.setObject('auth.me', exports.me.toJSON());
				resolve();
			},
			error: function(model, err) {
				reject(err);
			}
		});
	});
}

//////////////
// Touch ID //
//////////////

/**
 * Check if the TouchID is enabled and supported on the device and configuration.
 * @return {Boolean}
 */
exports.isTouchIDSupported = function() {
	return exports.config.useTouchID == true && TouchID != null && TouchID.isSupported();
};

/**
 * Authenticately safely via TouchID.
 * With "safely" we mean that in case of unsupported status of TouchID, the callback is always executed.
 * @param  {Function} callback The callbacl to call on success.
 */
exports.safeAuthViaTouchID = function(callback) {
	if (exports.isTouchIDSupported() && exports.getUseTouchID()) {
		TouchID.authenticate({
			reason: L('auth_touchid_reason'),
			callback: function(e) { 
				// We need setTimeout for thread crashes
				setTimeout(function(){
					if (e.success) {
						callback({ touchID: true });
					}
				}, 0);
			}
		});
	} else {
		callback({ touchID: false });
	}
};

/**
 * Set the app to use the TouchID identification on stored and offline login (auto also).
 * @param {Boolean} val The value.
 */
exports.setUseTouchID = function(val) {
	Ti.App.Properties.setBool('auth.touchid.use', val);
};

/**
 * Check if the app should use the TouchID identification.
 * @param {Boolean} val The value.
 */
exports.getUseTouchID = function() {
	return Ti.App.Properties.getBool('auth.touchid.use', false);
};

/**
 * Load a driver
 * @return {Object}
 */
exports.loadDriver = function(name) {
	return Alloy.Globals.Trimethyl.loadDriver('auth', name, {
		login: function() {},
		storedLogin: function() {},
		isStoredLoginAvailable: function() {},
		logout: function() {}
	});
};

/**
 * Add an event to current module
 */
exports.event = function(name, cb) {
	Event.on('auth.' + name, cb);
};

/**
 * Get current User model
 * @return {Backbone.Model}
 */
exports.getUser = function(){
	return exports.me;
};

/**
 * Check if the user is logged in
 * @return {Boolean}
 */
exports.isLoggedIn = function() {
	return exports.me !== null;
};

/**
 * Get current User ID
 * Return 0 if no user is logged in
 * @return {Number}
 */
exports.getUserID = function(){
	if (exports.me === null) return 0;
	return exports.me.id;
};

/**
 * Login using selected driver
 * @param  {Object} opt
 * @param {Boolean} [opt.silent=false] Silence all global events
 * @param {String} [opt.driver="bypass"] The driver to use as string
 * @param {Function} [opt.success=null] The success callback to invoke
 * @param {Function} [opt.error=null] The error callback to invoke
 */
exports.login = function(opt) {
	opt = _.defaults(opt || {}, {
		success: Alloy.Globals.noop,
		error: Alloy.Globals.noop,
		silent: false,
		driver: 'bypass'
	});

	driverLogin(opt)

	.then(function(dataFromDriver) {
		return apiLogin(opt, _.extend({}, dataFromDriver, {
			method: opt.driver
		}));
	})

	.then(function(dataFromServer) {
		return fetchUserModel(opt, dataFromServer);
	})

	.then(function() {
		authProperties.setString('auth.driver', opt.driver);
	})

	.then(function() {
		return Q.promise(function(resolve, reject) {
			if (exports.isTouchIDSupported() && !opt.stored && exports.config.useTouchIDPromptConfirmation == true) {
				Dialog.confirm(null, L("auth_touchid_confirmation_message"), [
				{
					title: L('yes', 'Yes'),
					selected: true,
					callback: function() {
						exports.setUseTouchID(true);
						resolve();
					}
				},
				{
					title: L('no', 'No'),
					callback: function() {
						exports.setUseTouchID(false);
						resolve();
					}
				}
				]);
			} else {
				resolve();
			}
		});
	})

	.then(function() {
		var payload = { id: exports.me.id };
		opt.success(payload);
		if (opt.silent !== true) {
			Event.trigger('auth.success', payload);
		}
	})

	.fail(function(err) {
		Event.trigger('auth.error', err);
		opt.error(err);
	});
};

/**
 * Check if the stored login feature is available
 * Stored login indicate if the auth can be completed using stored credentials on the device
 * but require an Internet connection anyway
 * @return {Boolean}
 */
exports.isStoredLoginAvailable = function() {
	var driver = getStoredDriverString();
	if (driver == null) return false;

	return exports.loadDriver(driver).isStoredLoginAvailable();
};

/**
 * Login using stored credentials on the device
 * @param  {Object} opt
 * @param {Boolean} [opt.silent=false] Silence all global events
 * @param {Function} [opt.success=null] The success callback to invoke
 * @param {Function} [opt.error=null] The error callback to invoke
 */
exports.storedLogin = function(opt) {
	opt = _.defaults(opt || {}, {
		success: Alloy.Globals.noop,
		error: Alloy.Globals.noop
	});

	if (exports.isStoredLoginAvailable()) {
		exports.safeAuthViaTouchID(function() {
			exports.login(_.extend(opt || {}, {
				stored: true,
				driver: getStoredDriverString()
			}));
		});
	} else {
		opt.error();
	}
};

/**
 * Check if an offline login is available
 * @return {Boolean}
 */
exports.isOfflineLoginAvailable = function() {
	return Ti.App.Properties.hasProperty('auth.me');
};

/**
 * Login using offline properties
 * This method doesn't require an internet connection
 * @param  {Object} opt
 * @param {Boolean} [opt.silent=false] Silence all global events
 * @param {Function} [opt.success=null] The success callback to invoke
 * @param {Function} [opt.error=null] The error callback to invoke
 */
exports.offlineLogin = function(opt) {
	opt = _.defaults(opt || {}, {
		silent: false,
		success: Alloy.Globals.noop,
		error: Alloy.Globals.noop
	});

	if (exports.isOfflineLoginAvailable()) {
		exports.safeAuthViaTouchID(function() {
			exports.me = Alloy.createModel('user', Ti.App.Properties.getObject('auth.me'));

			var payload = {
				id: exports.me.id,
				offline: true
			};

			opt.success(payload);
			if (opt.silent !== true) {
				Event.trigger('auth.success', payload);
			}
		});
	} else {
		opt.error();
	}
};

/**
 * This method will select the best behaviour and will login the user
 * @param {Object} opt
 * @param  {Object} opt
 * @param {Boolean} [opt.silent=false] Silence all global events
 * @param {Function} [opt.success=null] The success callback to invoke
 * @param {Function} [opt.error=null] The error callback to invoke
 * @param {Function} [opt.timeout=10000] Timeout after the auto login will cause an error
 */
exports.autoLogin = function(opt) {
	opt = _.defaults(opt || {}, {
		success: Alloy.Globals.noop,
		error: Alloy.Globals.noop,
		timeout: 10000,
		silent: false
	});

	var success = opt.success;
	var error = opt.error;

	var timeouted = false;
	var errorTimeout = setTimeout(function() {
		timeouted = true;
		opt.error();
	}, opt.timeout);

	opt.success = function() {
		clearTimeout(errorTimeout);
		success.apply(null, arguments);
	};

	opt.error = function() {
		clearTimeout(errorTimeout);
		 // reset to noop to prevent that is invoked lately
		success = Alloy.Globals.noop;
		error.apply(null, arguments);
	};

	if (Ti.Network.online) {

		var driver = getStoredDriverString();
		if (exports.config.useOAuth == true && driver === 'bypass') {

			if (OAuth.getAccessToken() != null) {
				exports.safeAuthViaTouchID(function() {

					fetchUserModel()
					.then(function() {
						if (timeouted) return;

						var payload = {
							id: exports.me.id,
							oauth: true
						};

						opt.success(payload);
						if (opt.silent !== true) {
							Event.trigger('auth.success', payload);
						}

					})
					.fail(function(err) {
						opt.error(err);
						if (opt.silent != true) {
							Event.trigger('auth.error', err);
						}
					});

				});
			} else {
				opt.error();
			}

		} else {

			if (exports.isStoredLoginAvailable()) {
				exports.storedLogin({
					success: function(payload) {
						if (timeouted) return;

						opt.success(payload);
						if (opt.silent != true) {
							Event.trigger('auth.success', payload);
						}
					},
					error: opt.error,
					silent: true // manage internally
				});
			} else {
				opt.error();
			}

		}

	} else /* is offline */ {

		if (exports.isOfflineLoginAvailable()) {
			exports.offlineLogin({
				success: function(payload) {
					if (timeouted) return;

					opt.success(payload);
					if (opt.silent != true) {
						Event.trigger('auth.success', payload);
					}
				},
				error: opt.error,
				silent: true // manage internally
			});
		} else {
			opt.error();
		}

	}
};

/**
 * Logout the user
 * @param  {Function} callback Callback to invoke on completion
 */
exports.logout = function(callback) {
	Event.trigger('auth.logout', {
		id: exports.getUserID()
	});

	var driver = getStoredDriverString();
	if (driver != null) {
		exports.loadDriver(driver).logout();
	}

	var logoutUrl = (driver && driver.config ? driver.config.logoutUrl : null) || exports.config.logoutUrl;

	HTTP.send({
		url: logoutUrl,
		method: 'POST',
		timeout: 3000,
		complete: function() {
			exports.me = null;

			authProperties.removeProperty('auth.me');

			Cache.purge();

			if (exports.config.useOAuth == true) {
				OAuth.resetCredentials();
			} else {
				Ti.Network.removeHTTPCookiesForDomain(Util.getDomainFromURL(HTTP.config.base));
			}

			if (_.isFunction(callback)) callback();
		}
	});
};

//////////
// Init //
//////////

if (exports.config.useOAuth == true) {
	HTTP.addFilter('oauth', OAuth.httpFilter);
}

//////////////////////
// User persistence //
//////////////////////

if (Securely == null) {
	Ti.API.warn(MODULE_NAME + ": you are not including the security module, your auth is not secure");
	authProperties = Ti.App.Properties;
} else {

	var passphrase = Ti.App.Properties.getString('auth.secret', Ti.App.id);
	if (passphrase == Ti.App.id) {
		Ti.API.warn(MODULE_NAME + ": your auth passphrase is not securet, please change it");
	}

	authProperties = securely.createProperties({
		secret: passphrase
	});

}

var authProperties = null;

exports.getPersistence = function() {
	return authProperties;
};
