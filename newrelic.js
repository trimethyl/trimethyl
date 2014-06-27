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
}, Alloy.CFG.T.newrelic);
exports.config = config;

var TiNewRelic = null;

(function init() {
	if (!OS_IOS) return;

	try {
		TiNewRelic = require('ti.newrelic');
		if (config.token) {
			TiNewRelic.start(config.token);
		}
	} catch (e) {}
})();