var $$ = {};
var config = {};

exports.add = exports.on = function(k, f) {
	if (k in $$) $$[k].push(f);
	else $$[k] = [f];
	Ti.App.addEventListener(k, f);
};

exports.remove = exports.off = function(k, f) {
	if (!(k in $$)) return;
	for (var _f in $$[k]) {
		if (!_f || _f===f) {
			Ti.App.removeEventListener(k, _f);
			$$[k].splice(_f);
		}
	}
};

exports.fire = exports.trigger = function(k, a) {
	Ti.App.fireEvent(k, a);
};

exports.init = function(c) {
	config = _.extend(config, c);
};