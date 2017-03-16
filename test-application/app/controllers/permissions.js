function log(text, color) {
	Ti.API.log(text);
	$.sview.add($.UI.create('Label', {
		text: text,
		top: 5,
		color: color
	}));
}

function onSuccess() {
	log(this + ': ALLOWED', 'green');
}

function onError() {
	log(this + ': DENIED', 'yellow');
}

$.win.addEventListener('open', function() {
	['calendar','storage','camera','contacts'].forEach(function(e) {
		require('T/permissions/' + e).request(onSuccess.bind(e), onError.bind(e));
	});
});