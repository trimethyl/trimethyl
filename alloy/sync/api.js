/*

API REST sync for Alloy
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var Network = require('network');
var CRUD_TO_REST = {
	'create' : 'POST',
	'read' : 'GET',
	'update' : 'PUT',
	'delete' : 'DELETE'
};

exports.sync = function(method, model, opt) {

	var url = '';
	if (model.config.adapter.baseUrl && model.config.adapter.baseUrl.length>0) {
		url = model.config.adapter.baseUrl;
	} else {
		url = '/';
	}

	url += model.config.adapter.name;

	if (model.id) {
		url += '/' + model.id;
	}

	if (opt.patch) {
		method = 'patch';
	}

	var data = _.extend(opt.networkArgs || {}, {
		url: url,
		method: CRUD_TO_REST[method],
		info: { mime: 'json' }
	});

	if (Alloy.Backbone.emulateHTTP) {
		if (['DELETE','PUT','PATCH'].indexOf(data.method)!==false) {
			data.headers = _.extend(data.headers || {}, { 'X-HTTP-Method-Override': data.method });
			data.method = 'POST';
		}
	}

	switch (method) {

		case 'create':
		Network.send(_.extend(data, {
			data: model.toJSON(),
			success: function(resp) {
				if (resp.id) {
					opt.success(resp);
				} else {
					opt.success();
				}

				if (opt.ready) opt.ready();

				model.trigger("fetch");
			},
			fail: function(msg) {
				opt.error(model);
			}
		}));
		break;

		case 'read':
		Network.send(_.extend(data, {
			data: opt.args || {},
			success: function(resp) {
				opt.success(resp);

				if (opt.ready) opt.ready();
				model.trigger("fetch");
			},
			fail: function(msg) {
				opt.error(model);
			}
		}));
		break;

		case 'update':
		Network.send(_.extend(data, {
			data: _.pick(model.attributes, _.keys(opt.changes)),
			success: function(resp) {
				if (resp.id) {
					opt.success(resp);
				} else {
					opt.success();
				}

				if (opt.ready) opt.ready();
				model.trigger("fetch");
			},
			fail: function(msg) {
				opt.error(model);
			}
		}));
		break;

		case 'delete':
		Network.send(_.extend(data, {
			data: opt.args || {},
			success: function(resp) {
				opt.success();

				if (opt.ready) opt.ready();
				model.trigger("fetch");
			},
			fail: function(msg) {
				opt.error(model);
			}
		}));
		break;

	}
};