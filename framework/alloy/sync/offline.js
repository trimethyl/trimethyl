/*
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 */

exports.config = _.extend({
	handler: 'T/offline/sqlrest'
}, Alloy.CFG.T ? Alloy.CFG.T.offline : {});

var LOGNAME = 'Offline';

var Handler = require(exports.config.handler);

module.exports.afterModelCreate = function(Model, name) {
	Model = Model || {};

	if (Model.prototype.config.adapter != null && Model.prototype.config.adapter.idAttribute != null) {
		Model.prototype.idAttribute = Model.prototype.config.adapter.idAttribute;
	}

	return Model;
};

exports.sync = function(method, model, opt) {
	var new_handler = new Handler(model);

	// The Alloy SQL adapter wants an id or a query for the models
	if (model instanceof Backbone.Model && opt.id != null && model.id == null) {
		model.id = opt.id;
	}

	if (_.isFunction(new_handler[method])) {
		new_handler[method](opt);
	} else {
		if (_.isFunction(opt.error)) {
			opt.error(LOGNAME + ': Method ' + method + ' not implemented.');
		}
	}
};

exports.fullsync = function(model, opt) {
	exports.sync('fullsync', model, opt);
};

exports.readOffline = function(collection, opt) {
	exports.sync('readOffline', collection, opt);
};

exports.setOffline = function(model, value) {
	var new_handler = new Handler(model);

	new_handler.setOffline(value);
};

exports.isOffline = function(model) {
	var new_handler = new Handler(model);

	return new_handler.isOffline(model);
};

exports.destroyOffline = function(collection, opt) {
	exports.sync('destroyOffline', collection, opt);
};
