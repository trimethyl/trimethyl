/**
 * @class  	XCallbackURL
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/*
 * @type {Object}
 */
var config = _.extend({
	parserStrictMode: true
}, Alloy.CFG.T.xcallbackurl);
exports.config = config;

var parser = {
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

function parseUri(str) {
	var m = parser.parser[config.parserStrictMode ? 'strict' : 'loose'].exec(str);
	var uri = {};
	var i = 14;

	while (i--) uri[parser.key[i]] = m[i] || '';
	uri[parser.q.name] = {};
	uri[parser.key[12]].replace(parser.q.parser, function($0, $1, $2) {
		if ($1) uri[parser.q.name][$1] = $2;
	});

	return uri;
}

function XCallbackURL(url) {
	this.url = url;
	this.uri = parseUri(url);
}

XCallbackURL.prototype.toString = function() {
	return this.url;
};

XCallbackURL.prototype.isCallbackURL = function() {
	return this.uri.host.toLowerCase() === 'x-callback-url';
};

XCallbackURL.prototype.path = function() {
	return this.uri.path;
};

XCallbackURL.prototype.action = function() {
	return this.uri.file || this.uri.host;
};

XCallbackURL.prototype.param = function(key) {
	if (this.uri.queryKey != null && this.uri.queryKey[key] != null) {
		return unescape(this.uri.queryKey[key]);
	}
	return null;
};

XCallbackURL.prototype.params = function() {
	if (this.uri.queryKey == null) return [];
	var params = {};
	_.each(this.uri.queryKey, function(value, key) {
		params[key] = unescape(value);
	});
	return params;
};

XCallbackURL.prototype.hasSource = function() {
	return this.param('x-source') != null;
};

XCallbackURL.prototype.source = function() {
	return this.param('x-source');
};

XCallbackURL.prototype.hasCallback = function() {
	return this.param('x-success') != null;
};

XCallbackURL.prototype.callbackURL = function(params) {
	var url = this.param('x-success');
	if (_.isEmpty(url)) return '';
	return url + require('T/util').buildQuery(params);
};

XCallbackURL.prototype.hasErrorCallback = function() {
	return this.param('x-error') != null;
};

XCallbackURL.prototype.errorCallbackURL = function(params) {
	var url = this.param('x-error');
	if (_.isEmpty(url)) return '';
	return url + require('T/util').buildQuery(params);
};

module.exports = XCallbackURL;
