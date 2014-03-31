var config = {};
var $$ = null;

exports.open = function() {
	if ($$) { return $$; } // singleton
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