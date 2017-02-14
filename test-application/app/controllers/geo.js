var args = $.args;

var Geo = require('T/geo');

$.win.addEventListener('open', function showDialog() {
	$.win.removeEventListener('open', showDialog);
});

$.activateBgBtn.addEventListener('click', function() {
	Geo.authorizeLocationServices({
		inBackground: true
	});
});

$.activateBtn.addEventListener('click', function() {
	Geo.authorizeLocationServices({
		inBackground: false
	});
});

$.args.nav.openWindow( $.win );