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
var Prop = require('T/prop');

// Driver loader
function load(name) {
	return require( /\//.test(name) ? name : ('T/auth/'+name) );
}

// HTTP requests flag
var silent = true;

// User model object
var Me = null;


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
	if (!Prop.hasProperty('auth.driver') || !Prop.hasProperty('auth.me')) return null;
	return Prop.getString('auth.driver');
}

function driverLogin(opt) {
	var q = Q.defer();

	load(opt.driver)[ opt.stored === true ? 'storedLogin' : 'login' ]({
		data: opt.data,
		success: q.resolve,
		error: q.reject
	});

	return q.promise;
}

function apiLogin(data) {
	var q = Q.defer();

	HTTP.send({
		url: exports.config.loginUrl,
		method: 'POST',
		data: data,
		silent: silent,
		success: q.resolve,
		error: q.reject
	});

	return q.promise;
}

function fetchUserModel(info) {
	var q = Q.defer();

	Me = Alloy.createModel('user', { id: info.id || 'me' });
	Me.fetch({
		http: {
			refresh: true,
			cache: false,
			silent: silent
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
	if (_.isEmpty(opt.driver)) throw new Error('Please set a driver');
	silent = false;

	driverLogin(opt)
	.then(apiLogin)
	.then(fetchUserModel)
	.then(function(){
		Prop.setObject('auth.me', Me.toJSON());
		Prop.setString('auth.driver', opt.driver);
	})

	.then(function(){
		Event.trigger('auth.success', { id: Me.id });
		opt.success({ id: Me.id });
	})
	.fail(function(err){
		Event.trigger('auth.error', err);
		opt.error(err);
	});
};

/**
 * @method isStoredLoginAvailable
 * Check if the Stored Login feature is available
 * @return {Boolean}
 */
exports.isStoredLoginAvailable = function() {
	var driver = getStoredDriver();
	return !_.isEmpty(driver) && load(driver).isStoredLoginAvailable();
};

/**
 * @method storedLogin
 * Login using stored driver
 * @param  {Object} opt
 */
exports.storedLogin = function(opt) {
	silent = true;

	if (Ti.Network.online) {

		exports.login(_.extend(opt, {
			stored: true,
			driver: getStoredDriver()
		}));

	} else {

		if (Prop.hasObject('auth.me')) {
			Me = Alloy.createModel('user', Prop.getObject('auth.me'));
			opt.success();
		} else {
			opt.error();
		}

	}
};

/**
 * @method logout
 * @param  {Object} opt
 */
exports.logout = function(callback) {
	var userID = getUserID();
	var storedDriver = getStoredDriver();

	// Remove stored infos
	Me = null;
	Ti.App.Properties.removeProperty('auth.me');
	Ti.App.Properties.removeProperty('auth.driver');

	// Remove cache because can contain sensibile data
	if (Cache != null) Cache.prune();
	HTTP.resetCookies();

	// Logout on used driver
	load(storedDriver).logout(function(){
		Event.trigger('auth.logout', { id: userID });
		if (_.isFunction(callback)) callback();
	});
};
