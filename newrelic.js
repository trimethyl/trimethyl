/*

Newrelic module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var config = {};
var $$ = require('ti.newrelic');

exports.init = function(c) {
	config = _.extend(config, c);
	$$.start(config.token);
};