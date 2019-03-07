/*
 * @author  Flavio De Stefano <flavio.destefano@caffeina.com>
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 */

var Alloy = require('alloy');
var _ = require('alloy/underscore')._;
var Backbone = require('alloy/backbone');
var HTTP = require('T/http');
var Util = require('T/util');

var CRUD_to_REST = {
	'create': 'POST',
	'read': 'GET'
};

var CONTENT = 'content';
var PAGINATION = 'pagination';
var ATTRIBUTES = 'attributes';
var ERROR_TYPE = 'error';

exports.sync = function(method, model, opt) {
	var url = (model.config.adapter.baseUrl || '/') + model.config.adapter.name;
	var query = null;

	// Use either opt.url or the url built from adapter.baseUrl + adapter.name + opt.query
	if (_.isString(opt.url)) {
		url = opt.url;
	} else {
		if (model instanceof Backbone.Model) {
			url += model.id != null ? ('/' + model.id) : '';
			query = model.get('query');
		} else if (model.first() != null) {
			query = model.first().get('query');
		}

		query = query || opt.query;

		if (query != null) {
			if (_.isObject(query) || _.isArray(query)) {
				url += Util.buildQuery(query);
			} else if (_.isString(query)) {
				url += query.substr(0,1) === '?' ? query : ('?'+query);
			}
		}
	}

	var httpOpt = _.extend({}, model.config.http, opt.http, {
		url: url,
		method: CRUD_to_REST[method] || 'GET',
		format: 'json'
	});

	if (Alloy.Backbone.emulateHTTP) {
		if ([ 'DELETE', 'PUT', 'PATCH' ].indexOf(httpOpt.method) !== -1) {
			httpOpt.method = 'POST';
			httpOpt.headers = _.extend({}, httpOpt.headers, {
				'X-HTTP-Method-Override': httpOpt.method
			});
		}
	}

	switch (method) {

		case 'create':

		_.extend(httpOpt, { data: JSON.stringify(model.toJSON()) });
		HTTP.send(httpOpt).success(function(resp) {

			if (resp != null && resp.id != null) {
				opt.success(resp);
			} else {
				opt.error();
			}

		}).error(opt.error);
		break;

		case 'read':

		HTTP.send(httpOpt).success(function(resp) {

			if (resp != null && _.isObject(resp)) {
				if (resp[ATTRIBUTES] && resp[ATTRIBUTES].type && resp[ATTRIBUTES].type == ERROR_TYPE) {
					opt.error();
				}

				if (resp[CONTENT] != null) {
					var content = resp[CONTENT];

					if (resp[PAGINATION] != null) {
						model.pagination = resp[PAGINATION];
					}

					if (_.isArray(content)){
						if (model instanceof Backbone.Collection) {
							opt.success(content);
						} else {
							opt.success(_.first(content));
						}
					} else {
						opt.error();
					}
				}

			} else {
				opt.error();
			}

		}).error(function(err) {
			opt.error(err);
		});
		break;

	}
};