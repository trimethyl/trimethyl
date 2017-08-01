/**
 * @module  sentry
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * @author  Ani Sinanaj <ani.sinanaj@caffeinalab.com>
 */

var _Raven = require("T/ext/raven");
var Util   = require("T/util");
var HTTP   = require("T/http");

/**
 * @property config
 */
exports.config = _.extend({
	dsn: '',
	autoInstall: true,
	sentry_secret: ''
}, Alloy.CFG.T ? Alloy.CFG.T.sentry : {});

var defaults = {
	environment: Ti.App.deployType,
	serverName: Util.getPlatformFullName(),
	autoBreadcrumbs: {
	    'xhr': false,      // XMLHttpRequest
	    'console': true,   // console logging
	    'dom': false,      // DOM interactions, i.e. clicks/typing
	    'location': false  // url changes, including pushState/popState
	}
};

exports.config = _.extend(defaults, exports.config);

var MODULE_NAME = "sentry";

_Raven.setTransport(function RavenHTTPTransport(opt) {
	var config = _.clone(exports.config);

	var http_opts = {
		url: opt.url + Util.buildQuery(_(opt.auth).extend({"sentry_secret": config.sentry_secret})),
		data: JSON.stringify(opt.data),
		success: opt.onSuccess,
		error: opt.onError,
		method: "POST"
	};

	return HTTP.send(http_opts);
});

if (exports.config.autoInstall) {
	if (_.isEmpty(exports.config.dsn)) {
		Ti.API.warn(MODULE_NAME + ": You must set a dsn for Sentry");
	} else {
		_Raven.config(exports.config.dsn, _(exports.config).omit(["dsn", "sentry_secret"])).install();
	}
}

module.exports = _Raven;
