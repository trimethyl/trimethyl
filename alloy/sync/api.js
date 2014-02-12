exports.sync = function(method, model, opt) {
	switch (method) {
		case 'read':
		require('network').send(_.extend({
			url: '/' + model.config.adapter.name + (model.id?'/'+model.id:''),
			data: opt.args||{},
			success: function(resp) {
				opt.success(resp);
				if (model.ready) model.ready();
				if (opt.ready) opt.ready();
			},
			error: function(msg) {
				opt.error();
				if (model.mistake) model.mistake();
				if (opt.mistake) opt.mistake(msg);
			}
		}, opt.networkArgs||{}));
		break;
	}
};