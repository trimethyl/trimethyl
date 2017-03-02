var Q = T('ext/q');

var UT = require('unit-tests');
var UTMethodsKeys = null;

function log(text, color, top) {
	Ti.API.log(text);
	$.sview.add($.UI.create('Label', {
		text: text,
		top: top || 0,
		color: color
	}));
}

function doNextTest() {
	var key = UTMethodsKeys.shift();
	if (key == null) return;

	log('Starting test ' + key.toUpperCase() + '...', '#fff', 5);

	var fn = UT.methods[key];

	Q.when(fn(),
	function() {
		log('PASSED', 'green');
		doNextTest();
	},
	function(err) {
		Ti.API.error(err);
		log('REJECTED: ' + (err.message ? err.message : err.toString()), 'red');
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
				Alloy.createController(name, {
					nav: $.nav
				});
			}
		};
	}).concat({ title: 'Cancel', cancel: true }));
});

$.nav.open();

if (Alloy.CFG.initController) {
	Alloy.createController(Alloy.CFG.initController, {
		nav: $.nav
	});
}