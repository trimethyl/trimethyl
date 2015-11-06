var UT = require('/unit-tests');
var UTKeys = Object.keys(UT);

function log(text, color, top) {
	Ti.API.log(text);
	$.sview.add($.UI.create('Label', {
		text: text,
		top: top || 0,
		color: color
	}));
}

(function next() {

	var key = UTKeys.shift();
	var fn = UT[key];

	log('Starting test ' + key.toUpperCase() + '...', '#fff', 5);

	Q.when(fn(),
	function() {
		log('PASSED', 'green');
		next();
	},
	function(err) {
		Ti.API.error(err);
		log('REJECTED: ' + err.toString(), 'red');
		next();
	}
	);

})();

$.nav.open();

$.nav.openWindow( Alloy.createController('ui-select').getView() );