var Network = require('network');

var CRUD_TO_REST = {
	'create' : 'POST',
	'read' : 'GET',
	'update' : 'PUT',
	'delete' : 'DELETE'
};

exports.sync = function(method, model, opt) {

	model.idAttribute = model.config.adapter.idAttribute || 'id';

	var url = model.config.adapter.baseUrl ? model.config.adapter.baseUrl : '/';
	url += model.config.adapter.name;
	if (model[model.idAttribute]) url += '/' + model[model.idAttribute];

	var data = _.extend(opt.networkArgs || {}, {
		url: url,
		method: CRUD_TO_REST[method],
		info: { mime: 'json' }
	});

	if (Alloy.Backbone.emulateHTTP) {
		if (data.method==='PUT' || data.method==='DELETE') {
			data.headers = _.extend(data.headers || {}, { 'X-HTTP-Method-Override': data.method });
			data.method = 'POST';
		}
	}

	switch (method) {

		case 'read':
		Network.send(_.extend(data, {
			data: opt.args || {},
			success: function(resp) {
				opt.success(resp);
				if (opt.ready) opt.ready();
				model.trigger("fetch");
			},
			error: function(msg) {
				opt.error(model);
			}
		}));
		break;

		case 'update':
		Network.send(_.extend(data, {
			data: model.toJSON(),
			success: function(resp) {
				opt.success(resp);
				if (opt.ready) opt.ready();
				model.trigger("fetch");
			},
			error: function(msg) {
				opt.error(model);
			}
		}));
		break;

		case 'create':
		Network.send(_.extend(data, {
			data: model.toJSON(),
			success: function(resp) {
				opt.success(resp);
				if (opt.ready) opt.ready();
				model.trigger("fetch");
			},
			error: function(msg) {
				opt.error(model);
			}
		}));
		break;

		case 'delete':
		Network.send(_.extend(data, {
			data: opt.args || {},
			success: function(resp) {
				opt.success(resp);
				if (opt.ready) opt.ready();
				model.trigger("fetch");
			},
			error: function(msg) {
				opt.error(model);
			}
		}));
		break;

	}
};