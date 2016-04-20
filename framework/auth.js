/**
 * @module  auth
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {String} [config.loginUrl="/login"] 		URL to login-in
 * @property {Boolean} [config.useOAuth=false] 			Use OAuth method to authenticate
 * @property {String} [config.oAuthAccessTokenURL] 	OAuth endpoint to retrieve access token
 */
exports.config = _.extend({
	loginUrl: '/login',
	useOAuth: false,
	oAuthAccessTokenURL: '/oauth/access_token'
}, Alloy.CFG.T ? Alloy.CFG.T.auth : {});

var Q = require('T/ext/q');
var HTTP = require('T/http');
var Event = require('T/event');
var Cache = require('T/cache');
var Util = require('T/util');

var OAuth = require('T/support/oauth');
OAuth.vars.accessTokenURL = exports.config.oAuthAccessTokenURL;
OAuth.vars.httpBase = HTTP.config.base;

var Me = null; // User model object

/**
 * OAuth object instance of oauth module
 * @see  support/oauth
 * @type {Object}
 */
exports.OAuth = OAuth;

////////////
// Driver //
////////////

function getStoredDriverString() {
	var hasDriver = Ti.App.Properties.hasProperty('auth.driver');
	var hasMe = Ti.App.Properties.hasProperty('auth.me');
	if (hasDriver && hasMe) {
		return Ti.App.Properties.getString('auth.driver');
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
		Me = Alloy.createModel('user', { id: dataFromServer.id || 'me' });
		Me.fetch({
			http: {
				refresh: true,
				cache: false,
			},
			success: function() {
				Ti.App.Properties.setObject('auth.me', Me.toJSON());
				resolve();
			},
			error: function(model, err) {
				reject(err);
			}
		});
	});
}


/**
 * Load a driver
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
 * Add the event
 */
exports.event = function(name, cb) {
	Event.on('auth.' + name, cb);
};

/**
 * Get current User model
 * @return {Object}
 */
exports.getUser = function(){
	return Me;
};

/**
 * Check if the user is logged in
 * @return {Boolean}
 */
exports.isLoggedIn = function() {
	return Me !== null;
};

/**
 * Get current User ID
 * @return {Number}
 */
exports.getUserID = function(){
	if (Me === null) return 0;
	return Me.id;
};

/**
 * Login using selected driver
 * @param  {Object} opt
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
		Ti.App.Properties.setString('auth.driver', opt.driver);

		var payload = {
			id: Me.id
		};

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
 * Check if the Stored login feature is available
 * @return {Boolean}
 */
exports.isStoredLoginAvailable = function() {
	var driver = getStoredDriverString();
	if (driver == null) return false;

	return exports.loadDriver(driver).isStoredLoginAvailable();
};

/**
 * Login using stored driver
 * @param  {Object} opt
 */
exports.storedLogin = function(opt) {
	opt = _.defaults(opt || {}, {
		success: Alloy.Globals.noop,
		error: Alloy.Globals.noop
	});

	if (exports.isStoredLoginAvailable()) {
		exports.login(_.extend(opt || {}, {
			stored: true,
			driver: getStoredDriverString()
		}));
	} else {
		opt.error();
	}
};

/**
 * Check if an offline login is available
 * @return {Boolean} [description]
 */
exports.isOfflineLoginAvailable = function() {
	return Ti.App.Properties.hasProperty('auth.me');
};

/**
 * Login using offline properties
 * @param  {Object} opt
 */
exports.offlineLogin = function(opt) {
	opt = _.defaults(opt || {}, {
		silent: false,
		success: Alloy.Globals.noop,
		error: Alloy.Globals.noop
	});

	if (exports.isOfflineLoginAvailable()) {

		Me = Alloy.createModel('user', Ti.App.Properties.getObject('auth.me'));

		var payload = {
			id: Me.id,
			offline: true
		};

		opt.success(payload);
		if (opt.silent !== true) {
			Event.trigger('auth.success', payload);
		}

	} else {
		opt.error();
	}
};

/**
 * This method will select the best behaviour and will login the user
 * @param {Object} opt
 * @param {Function} [opt.success] 			Success callback
 * @param {Function} [opt.error] 			Error callback
 * @param {Number} 	[opt.timeout=10000] 	Timeout
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
			
				fetchUserModel()
				.then(function() {
					if (timeouted) return;

					var payload = {
						id: Me.id,
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

	} else {
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
 * @param  {Function} callback
 */
exports.logout = function(callback) {
	Event.trigger('auth.logout', {
		id: exports.getUserID()
	});

	var driver = getStoredDriverString();
	if (driver != null) {
		exports.loadDriver(driver).logout();
	}

	HTTP.send({
		url: '/logout',
		method: 'POST',
		timeout: 3000,
		complete: function() {
			Me = null;

			Ti.App.Properties.removeProperty('auth.me');
			Ti.App.Properties.removeProperty('auth.driver');

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
