/*
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 */

exports.config = _.extend({
	ttl: 30,
	remoteAdapter: 'rest',
	localAdapter: 'sql',
	syncTableName: '__sync',
	infoTableName: '__info'
}, (Alloy.CFG.T && Alloy.CFG.T.offline) ? Alloy.CFG.T.offline.sqlrest : {});

var SQLite = require('T/sqlite');
var Util = require('T/util');
var Q = require('T/ext/q');

var LOGNAME = 'Offline/SQLREST';

var TABLES = {
	sync: {
		collection_name: exports.config.syncTableName,
		columns: {
			id: 'INTEGER PRIMARY KEY',
			timestamp: 'INTEGER NOT NULL',
			m_id: 'TEXT',
			m_table: 'TEXT',
			file_name: 'TEXT',
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
			file_name: 'TEXT',
			offline: 'INTEGER',
			timestamp: 'INTEGER'
		}
	}
};

var Local = null;
var Remote = null;

var DB = new SQLite('_alloy_');

/** Initialize the tables for sync and timestamp references */
function SQLREST(model) {
	// Create the utility tables
	_.each(TABLES, function(table) {
		DB.run('CREATE TABLE IF NOT EXISTS ' + table.collection_name + '(' + _.map(table.columns, function(type, key) {
			return key + ' ' + type;
		}).join(', ') + ');');
	});

	this.model = model;
	this.config = _.extend({}, exports.config, model.config.adapter);

	// Add this model to the event listener queue
	if (Alloy.Globals.offline_models == null) Alloy.Globals.offline_models = [];
	if (Alloy.Globals.offline_models.indexOf(this.config.file_name) < 0) Alloy.Globals.offline_models.push(this.config.file_name);

	// Initialize the event listener if needed
	if (Alloy.Globals.offline_listener == null) {
		Alloy.Globals.offline_listener = function(e) {
			if (!e.online || Alloy.Globals.offline_handling) return;
			Alloy.Globals.offline_handling = true;
			var stopped = [];
			var subscribed = Alloy.Globals.offline_models || [];

			_.reduce(_.map(subscribed, function(name) {
				var model = Alloy.createModel(name);

				return Q.promise(function(resolve, reject) {
					model._push()
					.then(resolve)
					.catch(resolve);
				});
			}), Q.when, Q())
			.finally(function() {
				Alloy.Globals.offline_handling = false;
			});
		};
		Ti.Network.addEventListener('change', Alloy.Globals.offline_listener);
	}

	Local = require('alloy/sync/' + this.config.localAdapter);
	Remote = require('alloy/sync/' + this.config.remoteAdapter);
}

function deepClone(object) {
	var clone = _.clone(object);
	_.each(clone, function(value, key) {
		if (_.isObject(value)) {
			clone[key] = deepClone(value);
		}
	});
	return clone;
}

function stringifyResponse(obj) {
	var new_obj = deepClone(obj);

	_.each(new_obj, function(val, key) {
		if (_.isObject(val)) new_obj[key] = JSON.stringify(val);
	});

	return new_obj;
}

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

/** Get the info table row for this model/collection */
function getInfo(model) {
	if (model instanceof Backbone.Collection) {
		return DB.table(exports.config.infoTableName)
		.where({
			m_table: model.config.adapter.collection_name
		})
		.select()
		.all();
	} else if (model instanceof Backbone.Model || _.isObject(model)) {
		return DB.table(exports.config.infoTableName)
		.where({
			m_id: String(model.id),
			m_table: model.config.adapter.collection_name
		})
		.select()
		.single();
	}
}

/** Save the timestamp and offline status for a model */
function saveModelInfo(id, config, offline) {
	// Logger.debug('Saving ' + config.collection_name + '/' + id + ' offline ' + value + '...');
	if (getInfo({ id: id, config: {adapter: { collection_name : config.collection_name }}}) != null) {
		DB.table(config.infoTableName)
		.where({
			m_id: String(id),
			m_table: config.collection_name
		})
		.update({
			offline: ~~offline,
			timestamp: Util.now()
		})
		.run();
	} else {
		DB.table(config.infoTableName)
		.insert({
			m_id: String(id),
			m_table: config.collection_name,
			file_name: config.file_name,
			offline: ~~offline,
			timestamp: Util.now()
		})
		.run();
	}
}

/** Remove the info table row for this model */
function removeModelInfo(model) {
	return DB.table(exports.config.infoTableName)
	.where({
		m_id: String(model.id),
		m_table: model.config.adapter.collection_name
	})
	.delete()
	.run();
}

/** Get all the sync table rows, or the rows for a model. */
function getSyncs(model) {
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
	var mId = String(model.id);
	var mTable = model.config.adapter.collection_name;

	// Insert the new sync call
	DB.table(exports.config.syncTableName)
	.insert({
		timestamp: Util.now(),
		m_id: mId,
		m_table: mTable,
		method: method,
		file_name: model.config.adapter.file_name,
		model: JSON.stringify(model ? model.toJSON() : {}),
		options: JSON.stringify(opt || {})
	})
	.run();
}

/** Remove a row from the sync table */
function removeSyncRow(row) {
	DB.table(exports.config.syncTableName)
	.where(row)
	.delete()
	.run();
}

/** Postponed sync call for models in the sync table */
function postponedSync(method, model, opt) {
	return Q.promise(function(resolve, reject) {
		Remote.sync(method, model, _.extend({}, opt, {
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

/** Get a promise for the local update of a model */
function updateLocal(model, attributes, opt) {
	attributes = attributes || model.toJSON();

	return Q.promise(function(resolve, reject) {
		Local.sync('update', model.clone().set(stringifyResponse(attributes)), _.extend({}, opt, {
			success: resolve,
			error: reject
		}));
	});
}

/** Return true if this model is present in the sync table and valid for local fetch operations */
SQLREST.prototype._isLocalValid = function() {
	var self = this;
	var info_row = getInfo(self.model);

	return info_row != null && ((Boolean(info_row.offline) && info_row.timestamp != null) || info_row.timestamp + self.config.ttl > Util.now());
};

/** Push the enqueued changes for this model */
SQLREST.prototype._push = function() {
	var self = this;

	var postponed = getSyncs(self.model);

	return _.reduce(_.map(postponed, function(row) {
		var new_model = null;
		var model_to_sync = row.model;

		if (self.model instanceof Backbone.Model) {
			new_model = self.model.clone();
		} else {
			new_model = new self.model.model();
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
};

/** Get the remote version of a model/collection */
SQLREST.prototype._pull = function(opt) {
	var self = this;

	return Q.promise(function(resolve, reject) {
		Remote.sync('read', self.model, _.extend({}, opt, {
			cache: false,
			success: resolve,
			error: reject
		}));
	});
};

SQLREST.prototype._update = function(opt) {
	return updateLocal(this.model, null, opt);
};

SQLREST.prototype._destroy = function(opt) {
	var self = this;

	if (self.model instanceof Backbone.Collection) {
		// Call "delete" on every element if this is a Collection
		return Q.all(self.model.map(function(mod) {
			return Q.promise(function(resolve, reject) {
				// TODO try/catch?
				removeModelInfo(mod);
				_.each(getSyncs(mod), removeSyncRow);

				Local.sync('delete', mod, _.extend({}, opt, {
					success: resolve,
					error: reject
				}));
			});
		}));
	} else {
		// Simply call "delete" on the Model otherwise
		return Q.promise(function(resolve, reject) {
			// TODO try/catch?
			removeModelInfo(self.model);
			_.each(getSyncs(self.model), removeSyncRow);

			Local.sync('delete', self.model, _.extend({}, opt, {
				success: resolve,
				error: reject
			}));
		});
	}
};

/** Persist a model/collection in the local storage of choice */
SQLREST.prototype._persist = function(response) {
	var model = this.model;
	var config = this.config;

	function updateInfo(response) {
		// Update the timestamp
		var mId = String(response[model.idAttribute || 'id']);
		var mTable = config.collection_name;

		if (getInfo({ id: mId, config: {adapter: { collection_name : mTable }}}) != null) { // Also works with an object
			DB.table(config.infoTableName)
			.where({
				m_id: mId,
				m_table: mTable
			})
			.update({
				timestamp: Util.now()
			})
			.run();
		} else {
			DB.table(config.infoTableName)
			.insert({
				m_id: mId,
				m_table: mTable,
				file_name: config.file_name,
				offline: 0,
				timestamp: Util.now()
			})
			.run();
		}
	}

	return Q.allSettled(function() {
		var promises = [];

		if (model instanceof Backbone.Model) {
			promises.push(updateLocal(model, response)
				.then(updateInfo));
		} else {
			promises = _.map(response, function(attrs) {
				return updateLocal(new model.model(), attrs)
				.then(updateInfo);
			});
		}

		return promises;
	}())
	.then(function(res_arr) {
		_.each(res_arr, function(res) {
			if (res.state === "rejected") {
				Ti.API.error(LOGNAME + ': could not update the local copy of the model with name ' + config.collection_name + ': ' + res.reason);
			}
		});

		// Pass on the original response
		return response;
	});
};

/** Retrieve the local version of a model/collection */
SQLREST.prototype._retrieve = function(opt) {
	var self = this;

	if (self.model instanceof Backbone.Model) {
		return Q.promise(function(resolve, reject) {
			// Check if we can use the local copy
			if (self._isLocalValid()) {
				Local.sync('read', self.model, _.extend({}, opt, {
					success: function(response) {
						if (!_.isEmpty(response)) {
							resolve(parseResponse(response));
						} else {
							reject({ message: LOGNAME + ': Model <' + self.config.collection_name + '/' + self.model.id + '> empty.' });
						}
					},
					error: reject
				}));
			} else {
				reject({ message: LOGNAME + ': Model <' + self.config.collection_name + '/' + self.model.id + '> not found or expired.' });
			}
		});
	} else {
		return Q.reject({ message: LOGNAME + ': Cached read not yet supported for collections.' }); // TODO retrieve valid items?
	}
};

/** Completely sync the local version of a model/collection with the remote. */
SQLREST.prototype.fullsync = function(opt) {
	var self = this;

	self._push()
	.then(function() {
		return self._pull();
	})
	.then(function(response) {
		return self._persist(response);
	})
	.then(function(response) {
		if (self.model instanceof Backbone.Model) {
			self.model.set(response);
		} else {
			self.model.reset(response);
		}

		if (_.isFunction(opt.success)) {
			opt.success(response);
		}
	})
	.catch(function(err) {
		if (_.isFunction(opt.error)) {
			opt.error(err);
		}
	});
};

/** Update the local version of a model/collection, and try to send it to the remote. */
SQLREST.prototype.update = SQLREST.prototype.create = function(opt) {
	var self = this;
	var localOpt = _.extend({}, opt, { query: opt.query || opt.localQuery });
	var remoteOpt = _.extend({}, opt, { query: opt.query || opt.remoteQuery });

	self._update(localOpt)
	.then(function(response) {
		addSyncForModel('update', self.model, remoteOpt);

		return self._push()
		.then(function() {
			if (_.isFunction(opt.success)) {
				opt.success(response);
			}
		});
	})
	.catch(opt.error);
};

/** Delete the local version of a model/collection, and try to remove it from the remote. */
SQLREST.prototype.delete = function(opt) {
	var self = this;
	var localOpt = _.extend({}, opt, { query: opt.query || opt.localQuery });
	var remoteOpt = _.extend({}, opt, { query: opt.query || opt.remoteQuery });

	self._update(localOpt)
	.then(function(response) {
		addSyncForModel('delete', self.model, remoteOpt);

		return self._push()
		.then(function() {
			if (_.isFunction(opt.success)) {
				opt.success(response);
			}
		});
	})
	.catch(opt.error);
};

/** Fetch the local version of a model/collection, or pull from the remote and persist it if it doesn't exist. */
SQLREST.prototype.read = function(opt) {
	var self = this;
	var localOpt = _.extend({}, opt, { query: opt.query || opt.localQuery });
	var remoteOpt = _.extend({}, opt, { query: opt.query || opt.remoteQuery });

	// Fix for this adapter and the REST adapter.
	if (self.model instanceof Backbone.Model && opt.id != null) {
		self.model.id = opt.id;
	}

	self._retrieve(localOpt)
	.then(function(response) {
		Ti.API.debug(LOGNAME + ': model ' + self.config.collection_name + '/' + response[self.config.idAttribute || 'id'] + ' retrieved from localAdapter.');

		if (_.isFunction(opt.success)) {
			opt.success(response);
		}
	})
	.catch(function(err) {
		Ti.API.debug(LOGNAME + ':', err);

		self._pull(remoteOpt)
		.then(function(response) {
			// Update the local copy only if we are fetching a model
			// This is to avoid accidentally overwriting models with partial data
			if (self.model instanceof Backbone.Model) {
				self._persist(response)
				.finally(function() {
					if (_.isFunction(opt.success)) {
						opt.success(response);
					}
				});
			} else {
				if (_.isFunction(opt.success)) {
					opt.success(response);
				}
			}
		})
		.catch(opt.error);
	});
};

SQLREST.prototype.setOffline = function(value) {
	var model = this.model;
	var config = this.config;

	if (model == null || config == null) return;

	if (model instanceof Backbone.Model) {
		saveModelInfo(model.id, config, value);
	} else {
		model.each(function(mod) {
			saveModelInfo(mod.id, config, value);
		});
	}
};

SQLREST.prototype.isOffline = function() {
	var row = getInfo(this.model);

	return (row != null) && Boolean(row.offline);
};

SQLREST.prototype.readOffline = function(opt) {
	var self = this;
	opt = opt || {};

	// Fix for this adapter and the REST adapter.
	if (self.model instanceof Backbone.Model) {
		Ti.API.error(LOGNAME + ': method "readOffline" not supported for models.');

		if (_.isFunction(opt.success)) {
			return opt.success({});
		}
	} else {
		var info_rows = getInfo(self.model);

		Local.sync('read', self.model, _.extend({}, opt, {
			success: function(response) {
				Ti.API.debug(LOGNAME + ': offline collection ' + self.config.collection_name + ' retrieved from localAdapter.');

				var resp = [];

				if (response.length) {
					resp = _.map(response, parseResponse);
				} else if (!_.isEmpty(response)) {
					resp = [parseResponse(response)];
				}

				self.model.reset(_.filter(resp, function(r_model) {
					var row = _.findWhere(info_rows, { m_id: String(r_model[self.model.idAttribute || 'id']), m_table: String(self.config.collection_name) });
					return row != null && row.offline;
				}));

				if (_.isFunction(opt.success)) {
					opt.success(self.model);
				}
			}
		}));
	}

};

SQLREST.prototype.destroyOffline = function(opt) {
	var self = this;
	opt = opt || {};

	if (self.model instanceof Backbone.Model) {
		if (self.model.id == null) {
			Ti.API.error(LOGNAME + ': couldn\'t destroy model without id.');

			if (_.isFunction(opt.error)) {
				opt.error({});
			}

			return;
		}

		self._destroy()
		.then(opt.success)
		.catch(opt.error);
	} else {
		self.model.readOffline({
			success: function(resp) {
				self._destroy()
				.then(opt.success)
				.catch(opt.error);
			},
			error: opt.error
		});
	}
};

module.exports = SQLREST;
