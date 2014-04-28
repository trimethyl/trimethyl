/*

DB module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var config = _.extend({}, Alloy.CFG.db);
var $$ = null;

exports.open = function() {
	if ($$) {
		// singleton
		return $$;
	}

	try {
		$$ = Ti.Database.open('app');
		return $$;
	} catch (ex) {
		console.error("DB: "+ex);
		return false;
	}
};

exports.init = function(c) {
	config = _.extend(config, c);
};