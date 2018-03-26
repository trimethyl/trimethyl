/*
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 */

var LOGNAME = 'LocalSync';
var SQLite = require('T/sqlite');
var Q = T('ext/q');

exports.config = _.extend({
	remoteAdapter: 'rest',
	localAdapter: 'sql',
	syncTableName: '__' + LOGNAME + '_sync',
	infoTableName: '__' + LOGNAME + '_info'
}, Alloy.CFG.T ? Alloy.CFG.T.localSync : {});

var Q = require('T/ext/q');

var TABLES = {
	sync: {
		collection_name: exports.config.syncTableName,
		columns: {
			id: 'INTEGER PRIMARY KEY',
			timestamp: 'INTEGER NOT NULL',
			m_id: 'TEXT',
			m_table: 'TEXT',
			method: 'TEXT',
			model: 'TEXT',
			options: 'TEXT'
		}
	},
	info: {
		collection_name: exports.config.infoTableName,
		columns: {
			id: 'INTEGER PRIMARY KEY',
			m_id: 'TEXT',
			m_table: 'TEXT',
			timestamp: 'INTEGER'
		}
	}
};

function LocalSync() {
	var DB = new SQLite('_alloy_');

	// Create the utility tables
	_.each(TABLES, function(table) {
		DB.run('CREATE TABLE IF NOT EXISTS ' + table.collection_name + '(' + _.map(table.columns, function(type, key) {
			return key + ' ' + type;
		}).join(', ') + ');');
	});
}

function getLocalAdapter(model) {
	var model_config = model.config.adapter || {};
	return require('alloy/sync/' + (model_config.localAdapter ? model_config.localAdapter : exports.config.localAdapter));
}

function getRemoteAdapter(model) {
	var model_config = model.config.adapter || {};
	return require('alloy/sync/' + (model_config.remoteAdapter ? model_config.remoteAdapter : exports.config.remoteAdapter));
}

//////////////////
// Sync methods //
//////////////////

LocalSync.prototype.read = function(model, opt) {
	var self = this;
	opt = opt || {};
	opt.success = opt.success || Alloy.Globals.noop;
	opt.error = opt.error || Alloy.Globals.noop;
	var query = _.extend(_.omit(opt, 'success', 'error'), { query: opt.query });
	var m_config = model.config.adapter;

	// Fix for this adapter and the REST adapter.
	if (model instanceof Backbone.Model && opt.id != null) {
		model.id = opt.id;
	}

	// Write remote -> read remote -> write local -> read local
	Q.when(function() {
		// Use the remote timestamp if specified, otherwise fetch it
		if (opt.remoteTimestamp != null) {
			return opt.remoteTimestamp;
		} else {
			return getTimestamp(model) || 0;
		}
	}())
	.then(function(rem_ts) {
		var loc_ts = getLocalTimestamp(model);

		// Check the given remote timestamp against the local timestamp
		if (rem_ts <= 0 || rem_ts >= loc_ts) {
			// Push all the pending changes and pull the new model from the remote
			var remote_resp = null;
			var remote_err = null;
			return writeRemote(model)
			.then(function() {
				return readRemote(model, query);
			})
			.then(function(response) {
				remote_resp = response;
				return writeLocal(model, response);
			})
			.catch(function(resp, err) {
				remote_err = err;
				Ti.API.error(LOGNAME + ': Error while syncing: ', err);
			})
			.finally(function() {
				if (remote_resp == null) {
					// Try to read the local
					readLocal(model, query)
					.then(function(response) {
						if (_.isEmpty(response)) {
							return Q.reject(remote_err);
						}

						if (model instanceof Backbone.Model) {
							Ti.API.debug(LOGNAME + ': model ' + m_config.collection_name + '/' + response[m_config.idAttribute || 'id'] + ' retrieved from localAdapter.');
						} else if (model instanceof Backbone.Collection) {
							Ti.API.debug(LOGNAME + ': collection ' + m_config.collection_name + ' retrieved from localAdapter.');
						}

						return response;
					})
					.then(opt.success)
					.catch(opt.error);
				} else {
					// Return the remote response to avoid a new local read
					opt.success(remote_resp);
				}
			});
		} else {
			return readLocal(model, query)
			.then(function(response) {

				if (model instanceof Backbone.Model) {
					Ti.API.debug(LOGNAME + ': model ' + m_config.collection_name + '/' + response[m_config.idAttribute || 'id'] + ' retrieved from localAdapter.');
				} else if (model instanceof Backbone.Collection) {
					Ti.API.debug(LOGNAME + ': collection ' + m_config.collection_name + ' retrieved from localAdapter.');
				}

				return response;
			})
			.then(opt.success)
			.catch(opt.error);
		}
	});
};

LocalSync.prototype.update = LocalSync.prototype.create = function(model, opt) {
	var self = this;
	opt = opt || {};
	var query = _.extend(_.omit(opt, 'success', 'error'), { query: opt.query });

	addSyncForModel('update', model, query);
	writeRemote(model)
	.then(function() {
		return readRemote(model, query);
	})
	.then(function(response) {
		writeLocal(model, response)
		.then(opt.success)
		.catch(opt.error);
	})
	.catch(function() {
		writeLocal(model, null, query)
		.then(opt.success)
		.catch(opt.error);
	});
};

LocalSync.prototype.delete = function(model, opt) {
	var self = this;
	opt = opt || {};
	var query = _.extend(_.omit(opt, 'success', 'error'), { query: opt.query });

	addSyncForModel('delete', model, query);
	writeRemote(model)
	.then(function() {
		return readRemote(model, query);
	})
	.then(function(response) {
		writeLocal(model, response)
		.then(opt.success)
		.catch(opt.error);
	})
	.catch(function() {
		writeLocal(model, null, query)
		.then(opt.success)
		.catch(opt.error);
	});
};

/////////////////////
// Support methods //
/////////////////////

/** Get the info table row for this model/collection */
function getInfo(model, opt) {
	var DB = new SQLite('_alloy_');
	var config = model.config.adapter;

	if (model instanceof Backbone.Collection) {
		return DB.table(exports.config.infoTableName)
		.where(_.extend({
			m_table: model.config.adapter.collection_name
		}, opt))
		.select()
		.all();
	} else if (model instanceof Backbone.Model || _.isObject(model)) {
		return DB.table(exports.config.infoTableName)
		.where(_.extend({
			m_id: String(model.id),
			m_table: config.collection_name
		}, opt))
		.select()
		.single();
	} else {
		return null;
	}
}

/** Remove the info table row(s) for this model/collection */
function removeInfo(model) {
	var DB = new SQLite('_alloy_');

	return DB.table(exports.config.infoTableName)
	.where({
		m_id: String(model.id),
		m_table: model.config.adapter.collection_name
	})
	.delete()
	.run();
}

function getLocalTimestamp(model) {
	var DB = new SQLite('_alloy_');

	if (model instanceof Backbone.Model) {
		if (model.id == null) {
			Ti.API.error(LOGNAME + ': cannot get the timestamp of a model without id.');

			return -1;
		}

		var info_row = getInfo(model);

		return (info_row != null && info_row.timestamp != null) ? info_row.timestamp : 0;
	} else {
		var timestamp = DB.value('SELECT MAX(timestamp) FROM "' + exports.config.infoTableName + '" WHERE m_table = "' + model.config.adapter.collection_name + '"');

		return timestamp || 0;
	}
}

/** Retrieve the local version of a model/collection if possible */
function readLocal(model, opt) {
	opt = opt || {};

	var info = getInfo(model);

	if (_.isEmpty(info)) {
		return Q.reject({ message: LOGNAME + ': Model <' + model.config.adapter.collection_name + '/' + model.id + '> not synced offline.' });
	}

	// Fix for adapters that don't support IDs listing (like Secure Properties in bencoding.securely)
	if (model instanceof Backbone.Collection && model.config.adapter.readFromSyncTable == true) {
		var response = [];
		var localAdapter = getLocalAdapter(model);

		return Q.all([
			_.map(info, function(row) {
				return Q.promise(function(resolve, reject) {
					var row_model = new model.model();
					row_model.id = row.m_id;

					localAdapter.sync('read', row_model, {
						success: function(model_resp) {
							response.push(parseResponse(model_resp));
						},
						error: reject
					});
				});
			})
			])
		.then(function() {
			return response;
		});
	} else {
		return Q.promise(function(resolve, reject) {
			getLocalAdapter(model)
			.sync('read', model, _.extend({}, opt, {
				success: function(response) {
					if (_.isArray(response)) {
						resolve(_.map(response, parseResponse));
					} else {
						resolve(parseResponse(response));
					}
				},
				error: reject
			}));
		});
	}
}

/** Get the remote version of a model/collection */
function readRemote(model, opt) {
	return Q.promise(function(resolve, reject) {
		getRemoteAdapter(model).sync('read', model, _.extend({}, opt, {
			cache: false,
			success: resolve,
			error: reject
		}));
	});
}

/** Get a promise for the local update of a model */
function updateLocalModel(model, attributes, opt) {
	attributes = attributes || model.toJSON();

	return Q.promise(function(resolve, reject) {
		getLocalAdapter(model).sync('update', model.clone().set(stringifyResponse(attributes)), _.extend({}, opt, {
			success: resolve,
			error: reject
		}));
	});
}

function updateModelTimestamp(model) {
	var DB = new SQLite('_alloy_');
	var config = model.config.adapter;
	var mId = null;

	if (model instanceof Backbone.Model) {
		mId = String(model.id);
	} else {
		mId = String(model[model.idAttribute || 'id']);
	}
	var mTable = config.collection_name;

	// Update the timestamp
	if (getInfo({ id: mId, config: {adapter: { collection_name : mTable }}}) != null) { // Also works with an object
		DB.table(exports.config.infoTableName)
		.where({
			m_id: mId,
			m_table: mTable
		})
		.update({
			timestamp: Util.now()
		})
		.run();
	} else {
		DB.table(exports.config.infoTableName)
		.insert({
			m_id: mId,
			m_table: mTable,
			timestamp: Util.now()
		})
		.run();
	}
}

/** Persist a model/collection through the local adapter */
function writeLocal(model, attributes, opt) {
	var config = model.config.adapter;
	var promises = null;

	if (model instanceof Backbone.Model) {
		promises = [ updateLocalModel(model, attributes, opt) ];
	} else {
		promises = _.map(attributes, function(attrs) {
			return updateLocalModel(new model.model(), attrs, opt);
		});
	}

	return _.reduce(_.map(promises, function(promise) {
		return promise.then(function(resp) {
			// Fix for models like "user", where the id is not known before the fetch
			model.id = config.forcedId != null ? config.forcedId : resp[model.idAttribute || 'id'];
			updateModelTimestamp(model);
		})
		.catch(function(err) {
			Ti.API.error(LOGNAME + ': could not update the local copy of the model with name ' + config.collection_name + ': ' + err);
		});
	}), Q.when, Q())
	.then(function() {
		// Pass on the original attributes
		return attributes;
	});
}

function writeRemote(model) {
	var postponed = getSyncs(model);
	var m_config = model.config.adapter;

	if (postponed.length > 1 && m_config.keepLast == true) {
		// Keep only the last postponed call
		_.each(postponed.splice(0, postponed.length-1), removeSyncRow);
	}

	return _.reduce(_.map(postponed, function(row) {
		var new_model = null;
		var model_to_sync = row.model;

		if (model instanceof Backbone.Model) {
			new_model = model.clone();
		} else {
			new_model = new model.model();
		}

		try {
			new_model.set(JSON.parse(row.model));
		} catch(err) {
			Ti.API.error(LOGNAME + ' error while parsing model data: ', err);
		}

		return postponedSync(row.method, new_model, row.options)
		.then(function(response) {
			Ti.API.debug(LOGNAME + ': ' + response.message);

			removeSyncRow(row);
		});
	}), Q.when, Q())
	.catch(function(err) {
		Ti.API.error(LOGNAME + ': ' + err.message);
	});
}

/** Delete the data of a model/collection from the given adapter */
function deleteLocal(model, opt) {
	if (model instanceof Backbone.Collection) {
		// Call "delete" on every element if this is a Collection
		return Q.all(model.map(function(mod) {
			return Q.promise(function(resolve, reject) {
				// TODO try/catch?
				removeInfo(mod);
				_.each(getSyncs(mod), removeSyncRow);

				getLocalAdapter(model).sync('delete', mod, _.extend({}, opt, {
					success: resolve,
					error: reject
				}));
			});
		}));
	} else {
		// Simply call "delete" on the Model otherwise
		return Q.promise(function(resolve, reject) {
			// TODO try/catch?
			removeInfo(model);
			_.each(getSyncs(model), removeSyncRow);

			getLocalAdapter(model).sync('delete', model, _.extend({}, opt, {
				success: resolve,
				error: reject
			}));
		});
	}
}

/** Get all the sync table rows, or the rows for a model. */
function getSyncs(model) {
	var DB = new SQLite('_alloy_');
	var query = DB.table(exports.config.syncTableName);

	if (model != null) {
		if (model instanceof Backbone.Model) {
			query.where({
				m_id: String(model.id),
				m_table: model.config.adapter.collection_name
			});
		} else {
			query.where({
				m_table: model.config.adapter.collection_name
			});
		}
	}

	return query
	.select()
	.all();
}

/** Add a row in the sync table for the call to a method for a model. */
function addSyncForModel(method, model, opt) {
	var DB = new SQLite('_alloy_');
	var mId = String(model.id);
	var mTable = model.config.adapter.collection_name;

	// Insert the new sync call
	DB.table(exports.config.syncTableName)
	.insert({
		timestamp: Util.now(),
		m_id: mId,
		m_table: mTable,
		method: method,
		model: JSON.stringify(model ? model.toJSON() : {}),
		options: JSON.stringify(opt || {})
	})
	.run();
}

/** Remove a row from the sync table */
function removeSyncRow(row) {
	var DB = new SQLite('_alloy_');

	DB.table(exports.config.syncTableName)
	.where(row)
	.delete()
	.run();
}

/** Postponed sync call for models in the sync table */
function postponedSync(method, model, opt) {
	return Q.promise(function(resolve, reject) {
		getRemoteAdapter(model).sync(method, model, _.extend({}, opt, {
			success: function(response) {
				resolve({ message: 'Success on postponed call to ' + method + ' for ' + model.id });
			},
			error: function(err) {
				if (Ti.Network.online && err.code != 0) {
					// Unrecoverable error
					resolve({ message: 'Could not ' + method + ' the remote model for ' + model.id + ': ' + err });
				} else {
					// Network offline or recoverable error
					reject({ message: 'Recoverable error on ' + method + ' call: ' + err });
				}
			}
		}));
	});
}

/** Make a deep copy of an object */
function deepClone(object) {
	var clone = _.clone(object);
	_.each(clone, function(value, key) {
		if (_.isObject(value)) {
			clone[key] = deepClone(value);
		}
	});
	return clone;
}

/** Convert all the properties of an object that are objects to string */
function stringifyResponse(obj) {
	var new_obj = deepClone(obj);

	_.each(new_obj, function(val, key) {
		if (_.isObject(val)) new_obj[key] = JSON.stringify(val);
	});

	return new_obj;
}

/** Try to convert all the properties of an object that are strings to objects */
function parseResponse(obj) {
	var new_obj = deepClone(obj);

	_.each(new_obj, function(val, key) {
		if (_.isString(val)) {
			try {
				new_obj[key] = JSON.parse(val);
			} catch(err) {
				new_obj[key] = val;
			}
		}
	});

	return new_obj;
}

/** Return a promise to get the current timestamp for the model/collection
 * if the method .getTimestamp() has been defined.
 * Otherwise, reject. */
function getTimestamp(model) {
	if (!_.isFunction(model.getTimestamp)) {
		return Q.reject({
			message: LOGNAME + ': The model ' + model.config.adapter.collection_name + ' does not implement the getTimestamp method.'
		});
	}

	return Q.when(model.getTimestamp());
}

/////////////
// Exports //
/////////////

module.exports.afterModelCreate = function(Model, name) {
	Model = Model || {};
	var adapter = Model.prototype.config.adapter;

	if (adapter != null && adapter.idAttribute != null) {
		Model.prototype.idAttribute = adapter.idAttribute;
	}

	// The Alloy sql adapter handles migrations in its afterModelCreate() method.
	// We expect the other local storage adapters to do the same.
	if (Model.migrations == null || Model.migrations.length <= 0) {
		return Model;
	}

	var local_config = deepClone(Model.prototype.config);
	local_config.adapter.type = adapter.localAdapter ? adapter.localAdapter : exports.config.localAdapter;

	var Cloned = Model.extend({
		config: local_config
	});

	if (Cloned != null) {
		var localAdapter = getLocalAdapter({ config: local_config });
		if (localAdapter && _.isFunction(localAdapter.afterModelCreate)) {
			localAdapter.afterModelCreate(Cloned, name);
		}
	}

	return Model;
};

module.exports.sync = function(method, model, opt) {
	opt = opt || {};
	opt.success = opt.success || Alloy.Globals.noop;
	opt.error = opt.error || Alloy.Globals.noop;
	// The Alloy SQL adapter wants an id or a query for the models
	if (model instanceof Backbone.Model) {
		// Fix for models like "user", where the id is not known before the fetch
		if (model.config.adapter.forcedId != null) {
			model.id = model.config.adapter.forcedId;
		}

		if (opt[model.idAttribute] != null && model.id == null) {
			model.id = opt[model.idAttribute];
		} else if (model.id != null && opt[model.idAttribute] == null) {
			opt[model.idAttribute] = model.id;
		}
	}

	if (opt.forceLocal == true) {
		// Fix for response parsing
		if (method == 'read') {
			readLocal(model, opt)
			.then(function(response) {
				var m_config = model.config.adapter;

				if (model instanceof Backbone.Model) {
					Ti.API.debug(LOGNAME + ': model ' + m_config.collection_name + '/' + response[m_config.idAttribute || 'id'] + ' forcefully retrieved from localAdapter.');
				} else if (model instanceof Backbone.Collection) {
					Ti.API.debug(LOGNAME + ': collection ' + m_config.collection_name + ' forcefully retrieved from localAdapter.');
				}

				return response;
			})
			.then(opt.success)
			.catch(opt.error);
		} else {
			getLocalAdapter(model).sync(method, model, opt);
		}

		return;
	}

	if (opt.sync != false) {
		var Adapter = new LocalSync();

		// This model has to be synced offline
		if (_.isFunction(Adapter[method])) {
			Adapter[method](model, opt);
		} else {
			opt.error(LOGNAME + ': Method ' + method + ' not implemented.');
		}
	} else {
		// Operate directly on the remote model
		getRemoteAdapter(model).sync(method, model, opt);
	}
};

module.exports.destroySynced = function(model, opt) {
	opt = opt || {};
	opt.success = opt.success || Alloy.Globals.noop;
	opt.error = opt.error || Alloy.Globals.noop;

	if (model instanceof Backbone.Model && model.id == null) {
		Ti.API.error(LOGNAME, ': couldn\'t destroy model without id.');

		if (_.isFunction(opt.error)) {
			opt.error({ message: LOGNAME + ': couldn\'t destroy model without id.' });
		}

		return;
	}

	readLocal(model, opt)
	.then(function(response) {

		if (_.isEmpty(response)) {
			Ti.API.warn(LOGNAME, ': destroySynced called on a empty model/collection. Resolving.');
			return Q.resolve();
		}

		if (model instanceof Backbone.Model) {
			model.set(response);
		} else {
			model.reset(response);
		}

		return deleteLocal(model, opt);
	})
	.then(function() {
		opt.success();
	})
	.catch(function(err) {
		// If we get an error reading the model/collection offline, we assume it's not synced at all
		Ti.API.warn(err);
		opt.success();
	});
};

module.exports.isSynced = function(model) {
	return !_.isEmpty(getInfo(model));
};
