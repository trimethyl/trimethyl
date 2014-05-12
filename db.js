/*

DB module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var config = _.extend({}, Alloy.CFG.db);
var $ = null;

exports.open = function() {
	if ($) return $;

	try {
		$ = Ti.Database.open('app');
		return $;
	} catch (ex) {
		Ti.API.error("DB: "+ex);
		return false;
	}
};