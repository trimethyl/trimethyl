var tests = [
	{
		title: 'Open Zuckerberg profile on FB',
		callback: function() {
			require('T/util').openFacebookProfile('4');
		}
	},
	{
		title: 'Open caffeinalab profile on TW',
		callback: function() {
			require('T/util').openTwitterProfile('caffeinalab');
		}
	}
];

$.main.addEventListener('click', function(e) {
	if (e.source.test) {
		e.source.test.callback();
	}
});

_.each(tests, function(t) {
	$.main.add( Ti.UI.createButton({
		title: t.title,
		test: t,
		left: 20,
		right: 20,
		top: 10,
		height: 40,
		font: {fontWeight:'bold'},
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 8,
	}) );
});

$.index.open();