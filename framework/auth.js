/**
 * @class  	Auth
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {String} [config.loginUrl="/login"] 	URL to login-in
 */
exports.config = _.extend({
	loginUrl: '/login',
}, Alloy.CFG.T ? Alloy.CFG.T.auth : {});

var Q = require('T/ext/q');
var HTTP = require('T/http');
var Event = require('T/event');

var Me = null; // User model object

/**
 * @method loadDriver
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
 * @method event
 */
exports.event = function(name, cb) {
	Event.on('auth.' + name, cb);
};

/**
 * @method getUser
 * Get current User model
 * @return {Object}
 */
exports.getUser = function(){
	return Me;
};

/**
 * Check if the user is logged in
 *
 * @return {Boolean}
 */
exports.isLoggedIn = function() {
	return Me !== null;
};

/**
 * @method getUserID
 * Get current User ID
 * @return {Number}
 */
exports.getUserID = function(){
	if (Me === null) return 0;
	return Me.id;
};

function getStoredDriver(){
	if (!Ti.App.Properties.hasProperty('auth.driver') || !Ti.App.Properties.hasProperty('auth.me')) {
		return null;
	}
	return Ti.App.Properties.getString('auth.driver');
}

function driverLogin(opt) {
	var q = Q.defer();

	var driver = exports.loadDriver(opt.driver);

	var method = opt.stored === true ? 'storedLogin' : 'login';
	driver[ method ]({
		data: opt.data,
		success: q.resolve,
		error: q.reject
	});

	return q.promise;
}

function apiLogin(opt, dataFromDriver) {
	var q = Q.defer();

	var driver = exports.loadDriver(opt.driver);

	HTTP.send({
		url: driver.config.loginUrl || exports.config.loginUrl,
		method: 'POST',
		data: dataFromDriver,
		errorAlert: false,
		success: q.resolve,
		error: q.reject,
	});

	return q.promise;
}

function fetchUserModel(opt, dataFromServer) {
	var q = Q.defer();

	Me = Alloy.createModel('user', {
		id: dataFromServer.id || 'me'
	});

	Me.fetch({
		http: {
			refresh: true,
			cache: false,
			errorAlert: false
		},
		success: q.resolve,
		error: q.reject
	});

	return q.promise;
}

/**
 * @method login
 * Login using selected driver
 * @param  {Object} opt
 */
exports.login = function(opt) {
	if (_.isEmpty(opt.driver)) {
		throw new Error('Please set a driver');
	}

	driverLogin(opt)

	.then(function(dataFromDriver) {
		return apiLogin(opt, _.extend(dataFromDriver, {
			method: opt.driver
		}));
	})

	.then(function(dataFromServer) {
		return fetchUserModel(opt, dataFromServer);
	})

	.then(function(userDataFromServer) {
		Ti.App.Properties.setObject('auth.me', Me.toJSON());
		Ti.App.Properties.setString('auth.driver', opt.driver);
	})

	.then(function(){
		Event.trigger('auth.success', { id: Me.id });
		if (_.isFunction(opt.success)) {
			opt.success({
				id: Me.id
			});
		}
	})

	.fail(function(e) {
		Event.trigger('auth.error', e);
		if (_.isFunction(opt.error)) opt.error(e);
	});
};

/**
 * @method isStoredLoginAvailable
 * Check if the Stored login feature is available
 * @return {Boolean}
 */
exports.isStoredLoginAvailable = function() {
	var driver = getStoredDriver();
	return !_.isEmpty(driver) && exports.loadDriver(driver).isStoredLoginAvailable();
};

/**
 * @method storedLogin
 * Login using stored driver
 * @param  {Object} opt
 * @param  {Object} opt
 */
exports.storedLogin = function(opt) {
	_.defaults(opt, {
		success: function(){},
		error: function(){}
	});

	if (exports.isStoredLoginAvailable()) {
		exports.login(_.extend(opt || {}, {
			stored: true,
			driver: getStoredDriver()
		}));
	} else {
		opt.error({});
	}
};

/**
 * @method isOfflineLoginAvailable
 * Check if an offline login is available
 * @return {Boolean} [description]
 */
exports.isOfflineLoginAvailable = function() {
	return Ti.App.Properties.hasProperty('auth.me');
};

/**
 * @method offlineLogin
 * Login using offline properties
 * @param  {Object} opt
 */
exports.offlineLogin = function(opt) {
	_.defaults(opt, {
		success: function(){},
		error: function(){}
	});

	if (exports.isOfflineLoginAvailable()) {
		Me = Alloy.createModel('user', Ti.App.Properties.getObject('auth.me'));
		var payload = {
			id: Me.id,
			offline: true
		};
		Event.trigger('auth.success', payload);
		opt.success(payload);
	} else {
		opt.error({});
	}
};

/**
 * @method autoLogin
 * This method will select the best behaviour and will login the user
 * @param  {Object} opt
 */
exports.autoLogin = function(opt) {
	_.defaults(opt, {
		success: function(){},
		error: function(){}
	});

	if (Ti.Network.online) {
		if (exports.isStoredLoginAvailable()) {
			exports.storedLogin(opt);
		} else {
			opt.error();
		}
	} else {
		if (exports.isOfflineLoginAvailable()) {
			exports.offlineLogin(opt);
		} else {
			opt.error();
		}
	}
};

/**
 * @method logout
 * @param  {Function} callback
 */
exports.logout = function(callback) {
	Event.trigger('auth.logout', {
		id: exports.getUserID()
	});

	var driver = getStoredDriver();
	if (driver != null) {
		exports.loadDriver(driver).logout();
	}

	Me = null;

	Ti.App.Properties.removeProperty('auth.me');
	Ti.App.Properties.removeProperty('auth.driver');

	require('T/cache').purge();
	HTTP.resetCookies();

	if (_.isFunction(callback)) callback();
};
