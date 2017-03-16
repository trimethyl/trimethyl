var Q = T('ext/q');

var UT = require('unit-tests');
var UTMethodsKeys = null;

function log(text, color, top) {
	Ti.API.log(text);
	$.sview.add($.UI.create('Label', {
		text: text,
		top: top || 1,
		color: color
	}));
}

function doNextTest() {
	var key = UTMethodsKeys.shift();
	if (key == null) return;

	log(key.toUpperCase(), 'white', 10);

	var fn = UT.methods[key];

	Q.when(fn(),
	function() {
		log('passed', 'green');
		doNextTest();
	},
	function(err) {
		Ti.API.error(err);
		log('rejected: ' + (err.message ? err.message : err.toString()), 'red');
		doNextTest();
	}
	);
}

// Configure UI tests

$.window.setActivityButton( $.uiTestsBtn );

$.testsBtn.addEventListener('click', function(e) {
	$.sview.removeAllChildren();
	UTMethodsKeys = Object.keys(UT.methods);
	doNextTest();
});

$.uiTestsBtn.addEventListener('click', function(e) {
	T('dialog').option('UI Tests', _.map(Alloy.CFG['ui-tests'], function(name) {
		return {
			title: name,
			callback: function() {
				$.nav.openWindow( Alloy.createController(name).getView() );
			}
		};
	}).concat({ title: 'Cancel', cancel: true }));
});

$.nav.open();