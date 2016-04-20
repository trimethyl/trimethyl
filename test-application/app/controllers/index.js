var Q = T('ext/q');

var UT = require('unit-tests');
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
		log('REJECTED: ' + (err.message ? err.message : err.toString()), 'red');
		next();
	}
	);

})();

// Configure UI tests

$.window.setActivityButton( $.uiTestsBtn );

$.uiTestsBtn.addEventListener('click', function(e) {
	T('dialog').option('UI Tests', _.map(Alloy.CFG['ui-tests'], function(name) {
		return {
			title: name,
			callback: function() {
				Alloy.createController(name, {
					nav: $.nav
				});
			}
		};
	}).concat({ title: 'Cancel', cancel: true }));
});

$.nav.open();