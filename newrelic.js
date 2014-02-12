var config = {};
var $$ = require('ti.newrelic');

exports.init = function(c) {
	config = _.extend(config, c);
	$$.start(config.token);
};