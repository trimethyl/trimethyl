/*

Newrelic module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var config = _.extend({
	token: null
}, Alloy.CFG.newrelic);

var $ = null;

(function init() {
	if (!OS_IOS) {
		return;
	}

	$ = require('ti.newrelic');
	config = _.extend(config, c);

	if (config.token) {
		$.start(config.token);
	}
})();