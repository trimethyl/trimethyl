var args = $.args;

var Camera = require('T/camera');

$.win.addEventListener('open', function showDialog() {
	$.win.removeEventListener('open', showDialog);

	Camera.selectPhoto({}, function(res) {
		$.photoPreview.image = res.media;
	});
});

$.args.nav.openWindow( $.win );