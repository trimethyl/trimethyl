/**
 * @module  auth
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {String} [config.loginUrl="/login"] The URL called by login().
 * @property {String} [config.logoutUrl="/logout"] The URL called by logout().
 * @property {String} [config.modelId="me"] The id for the user model.
 * @property {Boolean} [config.ignoreServerModelId=false] Force the module to use the configured modelId to fetch and store the user model.
 * @property {Boolean} [config.useOAuth=false] Use OAuth method to authenticate.
 * @property {String} [config.oAuthAccessTokenURL="/oauth/access_token"] OAuth endpoint to retrieve access token.
 * @property {String} [config.oAuthClientID="app"] OAuth client ID
 * @property {String} [config.oAuthClientSecret="secret"] OAuth client secret.
 * @property {Boolean} [config.useTouchID=false] Use TouchID to protect stored/offline login.
 * @property {Boolean} [config.enforceTouchID=false] If true, disable the stored/offline login when TouchID is disabled or not supported.
 * @property {Boolean} [config.useTouchIDPromptConfirmation=false] Ask the user if he wants to use the TouchID protection after the first signup. If false, the TouchID protection is used without prompts.
 */
exports.config = _.extend({

	loginUrl: '/login',
	logoutUrl: '/logout',
	modelId: 'me',
	ignoreServerModelId: false,

	useOAuth: false,
	oAuthAccessTokenURL: '/oauth/access_token',
	oAuthClientID: 'app',
	oAuthClientSecret: 'secret',

	useTouchID: false,
	enforceTouchID: false,
	useTouchIDPromptConfirmation: false,

}, Alloy.CFG.T ? Alloy.CFG.T.auth : {});

var MODULE_NAME = 'auth';

var Q = require('T/ext/q');
var HTTP = require('T/http');
var Event = require('T/event');
var Cache = require('T/cache');
var Util = require('T/util');
var Dialog = require('T/dialog');

var Prop = require('T/prop');
var TouchID = Util.requireOrNull("ti.touchid");

var BASE64_IMAGES = {
	// material fingerprint icon (.png 48x48 white)
	"fingerprint": "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",
	// material checkmark icon (.png 48x48 white)
	"checkmark": "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAAZiS0dEAAAAAAAA+UO7fwAAAAlwSFlzAAAASAAAAEgARslrPgAAAM1JREFUaN7tlDEOgkAQRScewZuoRL0ZpVt6J8+kobN8FlIQAmF3ic5o/mvJZt4bFsyEEEIIIf4PoAFab49a+R1w583V26dUfj+QZyli4y08ljezm5ltR4+e3m5Z8hObB7h4u0k+LJKXvOQlnz28BZoV549ANyGfviGf+mEdcKo4f/DcfBoNLYro5R9ud76/OtREuMuviQgjnxFxDi9fEhFWPicivPwgIs1E+PznKyOm3kTszRdGxJZfiPgN+ZmI35IfRKSwH6wQQgghPsgL4RJFaMiwTjgAAAAldEVYdGRhdGU6Y3JlYXRlADIwMTgtMDEtMThUMTQ6NTA6MDgrMDA6MDD/Y8ReAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDE4LTAxLTE4VDE0OjUwOjA4KzAwOjAwjj584gAAACh0RVh0c3ZnOmJhc2UtdXJpAGZpbGU6Ly8vdG1wL21hZ2ljay1xUmpVTjQwQ8xDRgMAAAAASUVORK5CYII=",
	// exclamation mark icon by Austin Andrews (.png 48x48 white)
	"exclamation": "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAAZiS0dEAAAAAAAA+UO7fwAAAAlwSFlzAAAASAAAAEgARslrPgAAAE1JREFUaN7t2MENgDAMBMGE/ns2b94orJBmCvBpv14LAH5snzo8M/MY2vvI1nUq4CsCagJqAmoCagJqAmoCagJqAmoCgJbPXE0AAPDCDfhxCDPL0CIIAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE4LTAxLTE4VDE0OjUzOjMxKzAwOjAwD0M9bQAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxOC0wMS0xOFQxNDo1MzozMSswMDowMH4ehdEAAAAodEVYdHN2ZzpiYXNlLXVyaQBmaWxlOi8vL3RtcC9tYWdpY2stZEtSU2J5YjC+EMF0AAAAAElFTkSuQmCC",
};

if (OS_IOS && exports.config.useTouchID == true && TouchID != null) {
	TouchID.setAuthenticationPolicy(TouchID.AUTHENTICATION_POLICY_BIOMETRICS);
}

var currentUser = null;
var fetchUserFunction = fetchUserModel;

/**
 * OAuth object instance of oauth module
 * @see  support/oauth
 * @type {Object}
 */
exports.OAuth = require('T/support/oauth');
exports.OAuth.__setParent(module.exports);

////////////
// Driver //
////////////

function getStoredDriverString() {
	var hasDriver = Prop.hasProperty('auth.driver');
	var hasMe = Prop.hasProperty('auth.me');
	if (hasDriver && hasMe) {
		return Prop.getString('auth.driver');
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

function driverStoreData(opt) {
	var driver = exports.loadDriver(opt.driver);
	driver.storeData(opt.data);
}

///////////////////////
// Server side login //
///////////////////////

function serverLoginWithOAuth(opt, dataFromDriver) {
	var oAuthPostData = {
		client_id: exports.OAuth.getClientID(),
		client_secret: exports.OAuth.getClientSecret(),
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
				exports.OAuth.storeCredentials(data);
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

		var user = Alloy.createModel('user', { id: id });
		user.fetch({
			http: {
				refresh: true,
				cache: false,
			},
			success: function() {
				Prop.setObject('auth.me', user.toJSON());
				resolve(user);
			},
			error: function(model, err) {
				reject(err);
			}
		});
	});
}

//////////////////////////////////////
// Show a Material Fingerprint view //
//////////////////////////////////////

function getAndroidTouchIDAlert(cancelCallback) {
	var fingerprintView = Ti.UI.createView({
		width: 40,
		height: 40,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: "#4E6A78",
		backgroundColor: "#4E6A78",
	});
	var fingerprintImage = Ti.UI.createImageView({
		width: 24,
		height: 24,
		image: Ti.Utils.base64decode(BASE64_IMAGES.fingerprint),
	});
	var fingerprintLabel = Ti.UI.createLabel({
		width: Ti.UI.FILL,
		height: Ti.UI.SIZE,
		left: 16,
		font: {
			fontSize: 16,
		},
		color: "#000000",
		opacity: 0.54,
		text: L("auth_touchid_touchsensor", "Touch sensor"),
	});
	var wrapper = Ti.UI.createView({
		height: Ti.UI.SIZE,
		width: Ti.UI.FILL,
	});
	var inner = Ti.UI.createView({
		height: Ti.UI.SIZE,
		width: Ti.UI.FILL,
		left: 24,
		right: 24,
		top: 28,
		layout: "horizontal",
	});
	fingerprintView.add(fingerprintImage);
	inner.add(fingerprintView);
	inner.add(fingerprintLabel);
	wrapper.add(inner);
	var dialog = Dialog.confirm("Touch ID", L("auth_touchid_reason"), [
	{
		title: L('cancel', 'Cancel'),
		callback: cancelCallback,
	}
	], {
		androidView: wrapper,
	});

	dialog.showSuccess = function() {
		fingerprintLabel.applyProperties({
			color: "#118675",
			opacity: 1,
			text: L("auth_touchid_success", "Fingerprint recognized"),
		});
		fingerprintView.applyProperties({
			backgroundColor: "#118675",
			borderColor: "#118675",
		});
		fingerprintImage.applyProperties({
			image: Ti.Utils.base64decode(BASE64_IMAGES.checkmark),
		});
	};

	dialog.showError = function() {
		fingerprintLabel.applyProperties({
			color: "#EE3918",
			opacity: 1,
			text: L("auth_touchid_error", "Fingerprint not recognized. Try again."),
		});
		fingerprintView.applyProperties({
			backgroundColor: "#EE3918",
			borderColor: "#EE3918",
		});
		fingerprintImage.applyProperties({
			image: Ti.Utils.base64decode(BASE64_IMAGES.exclamation),
		});
	};

	return dialog;
}

/**
 * Load a driver
 * @return {Object}
 */
exports.loadDriver = function(name) {
	var driver = Alloy.Globals.Trimethyl.loadDriver('auth', name, {
		login: function() {},
		storedLogin: function() {},
		isStoredLoginAvailable: function() {},
		logout: function() {},
		storeData: function() {}
	});
	driver.__setParent(module.exports);
	return driver;
};

/**
 * Add an event to current module
 */
exports.event = function(name, cb) {
	Event.on(MODULE_NAME + '.' + name, cb);
};

/**
 * Sets fetch function to override the default one
 * @param {Function} fn
 */
exports.setFetchUserFunction = function(fn) {
	if (!_.isFunction(fn)) {
		return Ti.API.error('Passed argument in setFetchUserFunction is not a function');
	}

	fetchUserFunction = fn;
};

/**
 * Reset the fetch function to the default one
 */
exports.resetFetchUserFunction = function() {
	fetchUserFunction = fetchUserModel;
};

//////////////
// Touch ID //
//////////////

/**
 * Check if the TouchID is enabled and supported on the device and configuration.
 * @return {Boolean}
 */
exports.isTouchIDSupported = function() {
	return exports.config.useTouchID == true && TouchID != null && TouchID.isSupported() && TouchID.deviceCanAuthenticate();
};

/**
 * Authenticate via TouchID.
 * @param {Function} success The callback to call on success.
 * @param {Function} error The callback to call on error.
 */
exports.authenticateViaTouchID = function(opt) {
	opt = _.defaults(opt || {}, {
		success: Alloy.Globals.noop,
		error: Alloy.Globals.noop
	});

	clearTimeout(exports.authenticateViaTouchID.timeout);

	if (exports.isTouchIDSupported() && exports.userWantsToUseTouchID()) {

		var dialog = null;

		if (OS_ANDROID) {
			dialog = getAndroidTouchIDAlert(function() {
				clearTimeout(exports.authenticateViaTouchID.timeout);
				TouchID.invalidate();
				dialog.hide();
				opt.error();
			});
			dialog.show();
		}

		if (opt.timeout) {
			exports.authenticateViaTouchID.timeout = setTimeout(function() {
				TouchID.invalidate();

				if (OS_ANDROID) {
					if (dialog) dialog.hide();

					opt.error();
				}
			}, opt.timeout);
		}

		TouchID.authenticate({
			reason: L('auth_touchid_reason'),
			callback: function(e) {
				if (e.success) {
					clearTimeout(exports.authenticateViaTouchID.timeout);

					if (OS_ANDROID) {
						dialog.showSuccess();
						setTimeout(function() {
							dialog.hide();
							opt.success({ touchID: true });
						}, 1000);
					} else {
						opt.success({ touchID: true });
					}

				} else {
					if (OS_ANDROID) {
						dialog.showError();
					} else {
						opt.error();
					}
				}
			}
		});

		return;
	}

	if (exports.config.enforceTouchID == true) {
		Ti.API.warn(MODULE_NAME + ": the user has denied access to TouchID or device doesn't support TouchID, but current configuration is enforcing TouchID usage");
		opt.error();
	} else {
		opt.success({ touchID: false });
	}
};

/**
 * Set or get the TouchID use property.
 * @param  {Boolean} val
 * @return {Boolean}
 */
exports.userWantsToUseTouchID = function(val) {
	if (val !== undefined) {
		Prop.setBool('auth.touchid.use', val);
	} else {
		return Prop.getBool('auth.touchid.use', false);
	}
};

/**
 * Get current User model
 * @return {Backbone.Model}
 */
exports.getUser = function(){
	return currentUser;
};

/**
 * Check if the user is logged in
 * @return {Boolean}
 */
exports.isLoggedIn = function() {
	return currentUser !== null;
};

/**
 * Get current User ID
 * Return 0 if no user is logged in
 * @return {Number}
 */
exports.getUserID = function(){
	if (currentUser === null) return 0;
	return currentUser.id;
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
		fetchUserFunction: null,
		silent: false,
		remember: true,
		driver: 'bypass'
	});

	driverLogin(opt)

	.then(function(dataFromDriver) {
		return apiLogin(opt, _.extend({}, dataFromDriver, {
			method: opt.driver
		}));
	})

	.then(function(dataFromServer) {
		return (opt.fetchUserFunction || fetchUserFunction)(opt, dataFromServer);
	})

	.then(function(user) {
		currentUser = user;
	}) 

	.then(function() {
		Prop.setString('auth.driver', opt.driver);
	})

	.then(function() {
		return Q.promise(function(resolve, reject) {
			if (
				exports.config.useTouchIDPromptConfirmation == true && 
				exports.isTouchIDSupported() && 
				opt.stored != true				
			) {
				Dialog.confirm("Touch ID", L("auth_touchid_confirmation_message"), [
				{
					title: L('yes', 'Yes'),
					preferred: true,
					callback: function() {
						exports.userWantsToUseTouchID(true);
						resolve({ 
							touchIDEnrolled: true 
						});
					}
				},
				{
					title: L('no', 'No'),
					callback: function() {
						exports.userWantsToUseTouchID(false);
						resolve({ 
							touchIDEnrolled: false
						});
					}
				}
				]);
			} else {
				resolve({
					touchIDEnrolled: false 
				});
			}
		});
	})

	.then(function(e) {
		if (opt.remember != true) return;
		if (e.touchIDEnrolled == true || exports.config.enforceTouchID != true) {
			driverStoreData(opt);
		}
	})

	.then(function() {
		var payload = { id: currentUser.id };
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
		exports.authenticateViaTouchID({
			timeout: opt.timeout,
			success: function() {
				exports.login(_.extend(opt || {}, {
					stored: true,
					driver: getStoredDriverString()
				}));
			},
			error: opt.error
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
	return Prop.hasProperty('auth.me');
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
		exports.authenticateViaTouchID({
			timeout: opt.timeout,
			success: function() {
				currentUser = Alloy.createModel('user', Prop.getObject('auth.me'));

				var payload = {
					id: currentUser.id,
					offline: true
				};

				opt.success(payload);
				if (opt.silent !== true) {
					Event.trigger('auth.success', payload);
				}
			},
			error: opt.error
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
 * @param {Function} [opt.timeout=10000] Timeout after the auto login will cause an error. Set to false to disable it.
 */
exports.autoLogin = function(opt) {
	opt = _.defaults(opt || {}, {
		success: Alloy.Globals.noop,
		error: Alloy.Globals.noop,
		fetchUserFunction: null,
		timeout: 10000,
		silent: false
	});

	var success = opt.success;
	var error = opt.error;

	var timeouted = false;
	var errorTimeout = null;

	if (opt.timeout) {
		errorTimeout = setTimeout(function() {
			timeouted = true;
			opt.error();
		}, opt.timeout);

		opt.success = function() {
			clearTimeout(errorTimeout);
			success.apply(null, arguments);
		};

		opt.error = function() {
			clearTimeout(errorTimeout);
			success = Alloy.Globals.noop;
			error.apply(null, arguments);
		};
	}

	if (Ti.Network.online) {

		var driver = getStoredDriverString();
		if (exports.config.useOAuth == true && driver === 'bypass') {

			if (exports.OAuth.getAccessToken() != null) {
				exports.authenticateViaTouchID({
					timeout: opt.timeout,
					success: function() {

						(opt.fetchUserFunction || fetchUserFunction)()
						.then(function(user) {
							currentUser = user;
							return Q.resolve();
						}) 
						.then(function() {
							if (timeouted) return;

							var payload = {
								id: currentUser.id,
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

					},
					error: function() {
						// Not a real error, no object passing
						opt.error();
					}

				});
			} else {
				// Not a real error, no object passing
				opt.error();
			}

		} else {

			if (exports.isStoredLoginAvailable()) {
				exports.storedLogin({
					timeout: opt.timeout,
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
				// Not a real error, no object passing
				opt.error();
			}

		}

	} else /* is offline */ {

		if (exports.isOfflineLoginAvailable()) {
			exports.offlineLogin({
				timeout: opt.timeout,
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
			// Not a real error, no object passing
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
			currentUser = null;

			Prop.removeProperty('auth.me');

			Cache.purge();

			if (exports.config.useOAuth == true) {
				exports.OAuth.resetCredentials();
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
	HTTP.addFilter('oauth', exports.OAuth.httpFilter);
}
