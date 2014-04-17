/*

Newrelic module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var config = {};
var $$ = null;

exports.init = function(c) {
	if (!OS_IOS) {
		return;
	}

	$$ = require('ti.newrelic');
	config = _.extend(config, c);

	$$.start(config.token);
};