/**
 * @module  support/oauth
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var isRequestingToken = false;
var baseDomain = null;

var MODULE_NAME = 'oauth';

var Prop = require('T/prop');

exports.__setParent = function(parent) {
	exports.__parent = parent;
};

var Q = require('T/ext/q');
var Util = require('T/util');
var HTTP = require('T/http');

exports.getClientID = function() {
	return exports.__parent.config.oAuthClientID;
};

exports.getClientSecret = function() {
	return exports.__parent.config.oAuthClientSecret;
};

exports.storeCredentials = function(data) {
	Ti.API.trace('Auth: storing OAuth credentials', data);
	Prop.setString(MODULE_NAME + '.' + 'access_token', data.access_token);
	Prop.setString(MODULE_NAME + '.' + 'refresh_token', data.refresh_token);
	Prop.setString(MODULE_NAME + '.' + 'expiration', Util.now() + data.expires_in);
};

exports.resetCredentials = function() {
	Ti.API.trace('Auth: resetting OAuth credentials');
	Prop.removeProperty(MODULE_NAME + '.' + 'access_token');
	Prop.removeProperty(MODULE_NAME + '.' + 'refresh_token');
	Prop.removeProperty(MODULE_NAME + '.' + 'expiration');
};

function hydratateRequest(req) {
	req.headers.Authorization = 'Bearer ' + exports.getAccessToken();
}

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

			HTTP.send({
				url: exports.__parent.config.oAuthAccessTokenURL,
				method: 'POST',
				data: oAuthPostData,
				suppressFilters: ['oauth'],
				success: function(data) {
					isRequestingToken = false;
					exports.storeCredentials(data);
					hydratateRequest(httpRequest);
					resolve();
				},
				error: function(err) {
					isRequestingToken = false;
					exports.resetCredentials();
					reject(err);
				}
			});
		});

	}

	hydratateRequest(httpRequest);
	return true;
};

exports.getAccessToken = function() {
	return Prop.getString(MODULE_NAME + '.' + 'access_token', null);
};

exports.getRefreshToken = function() {
	return Prop.getString(MODULE_NAME + '.' + 'refresh_token', null);
};

exports.isAccessTokenExpired = function() {
	return exports.getRemainingAccessTokenExpirationTime() <= 0;
};

exports.getRemainingAccessTokenExpirationTime = function() {
	var expire = Prop.getString(MODULE_NAME + '.' + 'expiration') << 0;
	if (expire == 0) return -1;

	return expire - Util.now();
};