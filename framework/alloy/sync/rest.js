/*
 * @author Flavio De Stefano <flavio.destefano@caffeina.com>
 * @author Andrea Jonus <andrea.jonus@caffeina.com>
 */

var HTTP = require('T/http');
var Util = require('T/util');

exports.config = _.extend({
	base: '/',
	idAttribute: 'id',
	collectionWrapper: 'data'
}, Alloy.CFG.T ? Alloy.CFG.T.rest : {});

var CRUD_to_REST = {
	'create': 'POST',
	'read': 'GET',
	'update': 'POST',
	'delete': 'DELETE',
	'patch': 'PATCH'
};

exports.sync = function(method, model, opt) {
	var adapter_cfg = _.extend({}, exports.config, model.config.adapter);
	var url = adapter_cfg.base + adapter_cfg.name;

	if (model instanceof Backbone.Model) {
		if (opt.id != null) {
			url += '/' + opt.id;
		} else if (model.id != null) {
			url += '/' + model.id;
		}
	}

	if (opt.query != null) {
		if (_.isObject(opt.query) || _.isArray(opt.query)) {
			url += Util.buildQuery(opt.query);
		} else if (_.isString(opt.query)) {
			url += opt.query.substr(0,1) === '?' ? opt.query : ('?'+opt.query);
		}
	}

	if (opt.patch) method = 'patch';

	var httpOpt = _.extend({}, model.config.http, opt.http, {
		url: url,
		method: CRUD_to_REST[method],
		format: 'json'
	}, opt.httpOverride);

	switch (method) {

		case 'patch':

		httpOpt = _.extend(httpOpt, { data: _.pick(model.attributes, _.keys(opt.changes)) });

		HTTP.send(httpOpt)
		.success(function(resp) {
			if (resp != null && resp[ adapter_cfg.idAttribute ] != null) {
				opt.success(resp);
			} else {
				opt.error(resp);
			}
		})
		.error(opt.error);
		break;

		case 'update':
		case 'create':

		httpOpt = _.extend(httpOpt, { data: model.toJSON() });

		HTTP.send(httpOpt)
		.success(function(resp) {
			if (resp != null && resp[ adapter_cfg.idAttribute ] != null) {
				opt.success(resp);
			} else {
				opt.error(resp);
			}
		})
		.error(opt.error);
		break;

		case 'read':

		HTTP.send(httpOpt)
		.success(function(resp) {

			if (resp != null) {
				if (model instanceof Backbone.Collection) {

					if (_.isArray(resp)) {
						opt.success(resp);
					} else if (_.isObject(resp)){
						opt.success(resp[ adapter_cfg.collectionWrapper ]);
					} else {
						opt.error(resp);
					}

				} else {

					if (resp != null && resp[ adapter_cfg.idAttribute ] != null) {
						opt.success(resp);
					} else {
						opt.error(resp);
					}

				}
			} else {
				opt.error(resp);
			}

		})
		.error(opt.error);
		break;

		case 'delete':

		HTTP.send(httpOpt)
		.success(opt.success)
		.error(opt.error);
		break;

	}
};
