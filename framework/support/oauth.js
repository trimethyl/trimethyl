/**
 * @module  support/oauth
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var isRequestingToken = false;
var storagePrefix = 'oauth';
var baseDomain = null;

var Q = require('T/ext/q');
var Util = require('T/util');
var HTTP = require('T/http');


/**
 * Retrieve the client ID of the OAuth read from the config
 * @return {String} The ID
 */
exports.getClientID = function() {
	return Ti.App.Properties.getString(storagePrefix + '.' + 'clientid') || 'app';
};

exports.getClientSecret = function() {
	return Ti.App.Properties.getString(storagePrefix + '.' + 'clientsecret') || 'app-secret';
};

exports.storeCredentials = function(data) {
	Ti.API.trace('Auth: storing OAuth credentials', data);

	Ti.App.Properties.setString(storagePrefix + '.' + 'access_token', data.access_token);
	Ti.App.Properties.setString(storagePrefix + '.' + 'refresh_token', data.refresh_token);
	Ti.App.Properties.setString(storagePrefix + '.' + 'expiration', Util.now() + data.expires_in);
};

exports.resetCredentials = function() {
	Ti.API.trace('Auth: resetting OAuth credentials');

	Ti.App.Properties.removeProperty(storagePrefix + '.' + 'access_token');
	Ti.App.Properties.removeProperty(storagePrefix + '.' + 'refresh_token');
	Ti.App.Properties.removeProperty(storagePrefix + '.' + 'expiration');
};

exports.httpFilter = function(httpRequest) {
	if (isRequestingToken) return;

	baseDomain = baseDomain || Util.getDomainFromURL(HTTP.config.base);
	if (httpRequest.domain !== baseDomain) return;

	var access_token = exports.getAccessToken();
	if (access_token == null) return;

	if (exports.isAccessTokenExpired()) {

		Ti.API.warn('Auth: access token is expired, refreshing...');

		var oAuthPostData = {
			client_id: exports.getClientID(),
			client_secret: exports.getClientSecret(),
			grant_type: 'refresh_token',
			refresh_token: exports.getRefreshToken(),
			access_token: exports.getAccessToken()
		};

		return Q.promise(function(resolve, reject) {
			isRequestingToken = true;

			var Auth = require('T/auth');

			HTTP.send({
				url: Auth.config.oAuthAccessTokenURL,
				method: 'POST',
				data: oAuthPostData,
				suppressFilters: ['oauth'],
				success: function(data) {

					exports.storeCredentials(data);

					Q.when(exports.httpFilter(httpRequest), function() {
						isRequestingToken = false;
						resolve();
					}, function(err) {
						isRequestingToken = false;
						reject(err);
					});

				},
				error: function(err) {
					isRequestingToken = false;
					exports.resetCredentials();
					reject(err);
				}
			});
		});

	}

	httpRequest.headers.Authorization = 'Bearer ' + access_token;
};

exports.getAccessToken = function() {
	return Ti.App.Properties.getString(storagePrefix + '.' + 'access_token', null);
};

exports.getRefreshToken = function() {
	return Ti.App.Properties.getString(storagePrefix + '.' + 'refresh_token', null);
};

exports.isAccessTokenExpired = function() {
	return exports.getRemainingAccessTokenExpirationTime() <= 0;
};

exports.getRemainingAccessTokenExpirationTime = function() {
	var expire = Ti.App.Properties.getString(storagePrefix + '.' + 'expiration') << 0;
	if (expire == 0) return -1;

	return expire - Util.now();
};