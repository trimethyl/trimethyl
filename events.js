var $$ = {};
var config = {};

exports.add = function(k, f) {
	if (k in $$) $$[k].push(f);
	else $$[k] = [f];
	Ti.App.addEventListener(k, f);
};

exports.remove = function(k, f) {
	if (!(k in $$)) return;
	for (var _f in $$[k]) {
		if (!_f || _f===f) {
			Ti.App.removeEventListener(k, _f);
			$$[k].splice(_f);
		}
	}
};

exports.fire = function(k, a) {
	Ti.App.fireEvent(k, a);
};

exports.init = function(c) {
	config = _.extend(config, c);
};