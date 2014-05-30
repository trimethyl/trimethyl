/**
 * @class  NewRelic
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Simply start NewRelic daemon
 */

/**
 * * **token**: The token of this NewRelic app. Default: `null`
 * @type {Object}
 */
var config = _.extend({
	token: null
}, Alloy.CFG.newrelic);
exports.config = config;

var $ = null;

(function init() {
	if (!OS_IOS) return;

	try {
		$ = require('ti.newrelic');
		if (config.token) {
			$.start(config.token);
		}
	} catch (e) {}
})();