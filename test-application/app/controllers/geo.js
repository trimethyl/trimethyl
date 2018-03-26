var args = $.args;

var Geo = require('T/geo');

$.win.addEventListener('open', function showDialog() {
	$.win.removeEventListener('open', showDialog);
});

$.geoBtn.addEventListener('click', function(e) {
	Geo.getCurrentPosition()
	.then(alert)
	.catch(alert);
});

$.activateBgBtn.addEventListener('click', function(e) {
	Geo.authorizeLocationServices({
		inBackground: true
	})
	.then(function() {
		e.source.title = 'OK';
	})
	.catch(function(e) {
		e.source.title = 'Error';
	});
});

$.activateBtn.addEventListener('click', function(e) {
	Geo.authorizeLocationServices({
		inBackground: false
	})
	.then(function() {
		e.source.title = 'OK';
	})
	.catch(function(e) {
		e.source.title = 'Error';
	});
});