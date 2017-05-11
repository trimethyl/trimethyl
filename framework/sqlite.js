/**
 * @module sqlite
 * @author Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {Boolean} [config.log=false]
 */
exports.config = _.extend({
	log: false,
}, Alloy.CFG.T ? Alloy.CFG.T.sqlite : {});

var Util = require('T/util');

var MODULE_NAME = 'sqlite';

var DatabaseModule = require('T/db');

function SQLite(name, file) {
	this.query = null;
	this.name = name;
	this.db = null;

	// Install the database from a file if needed, and close it immediately.
	if (file != null) {
		this.db = DatabaseModule.install(file, name);

		this.close();
	}
}

/**
 * Returns a new instance of SQLite opened from a file identified by the path argument.
 * @method fromFile
 * @static
 * @param  {String} path
 * @return {SQLite}
 */
SQLite.fromFile = function(path) {
	var file = Ti.Filesystem.getFile(path);
	var name = file.name.replace(/\..+$/, '');

	var destination_file = Ti.Filesystem.getFile(Util.getDatabaseDirectory() + '/' + name + '.sql');

	if (destination_file.exists()) destination_file.deleteFile();
	destination_file.write(file);

	// I know, this functions seems a bit an hack, but the API is inconsistent:
	// On iOS, open doesn't recognize a path, so we have to copy the SQL file in the exact location, then pass the name.
	// On Android, it simply works with open + file, but we have to copy to external storage if present.

	if (OS_IOS) {
		return new SQLite(name);
	} else if (OS_ANDROID) {
		return new SQLite(destination_file);
	}
};

/**
 * Start a chain to query informations
 * @method table
 * @param  {String} name The table name
 * @return {SQLite}
 */
SQLite.prototype.table = function(name) {
	this.query = {
		method: 'select',
		table: name,
		where: [],
		whereData: [],
		select: null,
		update: null,
		updateData: [],
		order: null,
		insert: null,
		insertData: []
	};
	return this;
};

/**
 * Select attributes
 * @method select
 * @return {SQLite}
 */
SQLite.prototype.select = function() {
	if (this.query === null) throw new Error('Start a query chain with .table() method');

	this.query.method = 'select';

	var args = _.toArray(arguments);
	if (args.length === 0) {

		/*
		.select()
		*/
		this.query.select = null;

	} else if (args.length > 1) {

		/*
		.select('id', 'title', 'order')
		*/
		this.query.select = _.object(args, args);

	} else {

		if (_.isArray(args[0])) {

			/*
			.select(['id', 'title', 'order'])
			*/
			this.query.select = _.object(args[0], args[0]);

		} else if (_.isObject(args[0])) {

			/*
			.select({
				"_alias": "alias",
				"_id": "id"
			})
			*/
			this.query.select = args[0];

		} else {

			/*
			.select('id')
			*/
			this.query.select = _.object([args[0]], [args[0]]);

		}

	}

	return this;
};

/**
 * Update attributes.
 * @method update
 * @param  {Object} obj
 * @return {SQLite}
 */
SQLite.prototype.update = function(obj) {
	if (this.query === null) throw new Error('Start a query chain with .table() method');

	/*
	.update({
		value: 2,
		other_value: 3
	})
	*/
	this.query.method = 'update';
	this.query.update = _.keys(obj);
	this.query.updateData = _.values(obj);

	return this;
};

/**
 * Perform a delete table.
 * @method delete
 * @return {SQLite}
 */
SQLite.prototype.delete = function() {
	if (this.query === null) throw new Error('Start a query chain with .table() method');

	this.query.method = 'delete';

	return this;
};


/**
 * Order the results in the select.
 * @method order
 * @alias orderBy
 * @return {SQLite}
 */
SQLite.prototype.order = SQLite.prototype.orderBy = function(key, direction) {
	if (this.query === null) throw new Error('Start a query chain with .table() method');

	this.query.order = {
		key: key,
		direction: direction || 'ASC'
	};

	return this;
};

/**
 * Perform a truncate table.
 * @method truncate
 * @return {SQLite}
 */
SQLite.prototype.truncate = function() {
	if (this.query === null) throw new Error('Start a query chain with .table() method');

	this.query.method = 'truncate';

	return this;
};

/**
 * Add where clauses.
 * @method where
 * @alias andWhere
 * @return {SQLite}
 */
SQLite.prototype.where = SQLite.prototype.andWhere = function() {
	if (this.query === null) throw new Error('Start a query chain with .table() method');

	var args = _.toArray(arguments);
	if (args.length === 1) {

		/*
		.where({
			id: 2,
			id_sub: 3
		})
		*/
		if (_.isObject(args[0])) {
			this.query.where = _.map(_.keys(args[0]), function(k) { return k + ' = ?'; });
			this.query.whereData = _.values(args[0]);
		} else if (_.isString(args[0])) {
			this.query.where.push(args[0]);
		}

	} else if (args.length === 2) {

		/*
		.where('id', 2)
		*/
		this.query.where.push(args[0] + ' = ?');
		this.query.whereData.push(args[1]);

	} else if (args.length === 3) {

		/*
		.where('string', 'LIKE', 'test')
		*/
		this.query.where.push(args[0] + ' ' + args[1] + ' ?');
		this.query.whereData.push(args[2]);

	}

	return this;
};

/**
 * Insert values
 * @method insert
 * @return {SQLite}
 */
SQLite.prototype.insert = function(obj) {
	if (this.query === null) throw new Error('Start a query chain with .table() method');

	/*
	.insert({
		value: 2,
		other_value: 3
	})
	*/
	this.query.method = 'insert';
	this.query.insert = _.keys(obj);
	this.query.insertData = _.values(obj);

	return this;
};

/**
 * Returns the query to pass to native module
 * @method getExequery
 * @return {Array}
 */
SQLite.prototype.getExequery = function() {
	if (this.query === null) throw new Error('Start a query chain with .table() method');

	var whereClause = (this.query.where.length > 0 ? (' WHERE ' + this.query.where.join(' AND ')) : '');
	switch (this.query.method) {

		case 'select':
		return [
			'SELECT ' + (this.query.select === null ? '*' : _.map(this.query.select, function(v, k){ return k + ' AS ' + v; }).join(',')) +
			' FROM [' + this.query.table + ']' +
			whereClause +
			(this.query.order === null ? '' : (' ORDER BY ' + this.query.order.key + ' ' + this.query.order.direction))
		]
		.concat(this.query.whereData);

		case 'update':
		return [
			'UPDATE [' + this.query.table + ']' +
			' SET ' + (this.query.update.join(' = ?, ') + ' = ?') +
			whereClause
		]
		.concat(this.query.updateData)
		.concat(this.query.whereData);

		case 'delete':
		return [
			'DELETE FROM [' + this.query.table + ']' +
			whereClause
		]
		.concat(this.query.whereData);

		case 'truncate':
		return [
			'TRUNCATE TABLE [' + this.query.table + ']'
		];

		case 'insert':
		return [
			'INSERT INTO [' + this.query.table + ']' +
			'(' + this.query.insert.join(',') + ') ' +
			'VALUES (' + this.query.insert.map(function(){ return '?'; }) + ')'
		]
		.concat(this.query.insertData);

	}
};

/**
 * Open the database.
 * Important: ALWAYS close the database after you are done with it.
 * @method open
 */
SQLite.prototype.open = function() {
	try {
		this.db = DatabaseModule.open(this.name);
	} catch (ex) {
		Ti.API.error(MODULE_NAME + ': Error while opening the database: ' + ex);
	}
};

/**
 * Close the database
 * @method close
 */
SQLite.prototype.close = function() {
	try {
		this.db.close();
	} catch (ex) {
		Ti.API.error(MODULE_NAME + ': Error while closing the database: ' + ex);
	}
};

/**
 * Executes a query.
 * Important: this method differs from SQLite.run() for the fact that it leaves the database open, and returns the result of the call to DatabaseModule.DB.execute().
 * @method execute
 * @alias exec
 * @param {String} query
 * @param {Vararg} values
 * @return {DatabaseModule.ResultSet}
 */
SQLite.prototype.execute = SQLite.prototype.exec = function() {
	Ti.API.warn(MODULE_NAME + ': WARNING: if you use .execute(), you will have to close the result set and the database manually!');

	var q = null;

	if (this.query === null) {
		q = arguments;
	} else {
		q = this.getExequery();
		this.query = null; // Reset query
	}

	if (exports.config.log) Ti.API.debug(MODULE_NAME + ':', q);

	this.open();
	return Function.prototype.apply.call(this.db.execute, this.db, q);
};

/**
 * Execute a query and apply a transformation function to the result set, then close the set and the database.
 * @param {String} [query]
 * @param {Vararg} [values]
 * @param {Function} fn The transformation function to apply to the dataset. It will be passed a `dataset` argument, which is an instance of DatabaseModule.ResultSet, and it should return the transformed result.
 * @return The result of fn
 */
SQLite.prototype.transform = function() {
	var _arguments = _.toArray(arguments);
	var transform = _arguments.pop();
	if (!_.isFunction(transform)) {
		throw new Error('SQLite: last argument of SQLite.transform must be a Function');
	}

	var q = null;

	if (this.query === null) {
		q = _arguments;
	} else {
		q = this.getExequery();
		this.query = null; // Reset query
	}

	if (exports.config.log) Ti.API.debug(MODULE_NAME + ':', q);

	this.open();
	var dataset = Function.prototype.apply.call(this.db.execute, this.db, q);

	var res = transform(dataset);

	if (dataset) dataset.close();
	this.close();

	return res;
};

/**
 * Run a query chain. Also accepts a query string.
 * @method run
 * @param {String} query
 * @param {Vararg} values
 */
SQLite.prototype.run = function() {
	this.open();

	var q = null;

	if (this.query === null) {
		q = arguments;
	} else {
		q = this.getExequery();
		this.query = null; // Reset query
	}

	if (exports.config.log) Ti.API.debug(MODULE_NAME + ':', arguments);

	var row = Function.prototype.apply.call(this.db.execute, this.db, q);

	if (row != null) {
		row.close();
	}

	this.close();
};

/**
 * Returns a single value
 * @method value
 * @alias val
 * @param {String} query
 * @param {Vararg} values
 */
SQLite.prototype.value = SQLite.prototype.val = function() {
	var _args = _.toArray(arguments);
	_args.push(function(row) {
		if (!row || row.isValidRow() === false) return null;

		return row.field(0);
	});

	return this.transform.apply(this, _args);
};

/**
 * Returns a single object (row)
 * @method single
 * @alias row
 * @param {String} query
 * @param {Vararg} values
 */
SQLite.prototype.single = SQLite.prototype.row = function() {
	var _args = _.toArray(arguments);
	_args.push(function(row) {
		if (!row || row.isValidRow() === false) return null;

		var obj = {};
		for (var i = 0; i < row.fieldCount; i++) {
			obj[row.fieldName(i)] = row.field(i);
		}

		return obj;
	});

	return this.transform.apply(this, _args);
};

/**
 * Returns a list of single values
 * @method list
 * @alias array
 * @param {String} query
 * @param {Vararg} values
 */
SQLite.prototype.list = SQLite.prototype.array = function() {
	var _args = _.toArray(arguments);
	_args.push(function(row) {
		var list = [];
		while (row && row.isValidRow() === true) {
			list.push(row.field(0));
			row.next();
		}
		return list;
	});

	return this.transform.apply(this, _args);
};

/**
 * Returns a list of objects (row)
 * @method all
 * @alias rows
 * @param {String} query
 * @param {Vararg} values
 */
SQLite.prototype.all = SQLite.prototype.rows = function() {
	var _args = _.toArray(arguments);
	_args.push(function(row) {
		var list = [];
		var fieldNames = [];
		while (row && row.isValidRow() === true) {
			var obj = {};
			for (var i = 0; i < row.fieldCount; i++) {
				fieldNames[i] = fieldNames[i] || row.fieldName(i);
				obj[fieldNames[i]] = row.field(i);
			}
			list.push(obj);
			row.next();
		}
		return list;
	});

	return this.transform.apply(this, _args);
};

/**
 * Loop over query
 * @method loop
 * @param {String} [query]
 * @param {Vararg} [values]
 * @param {Function} fn The function to loop over the query result
 */
SQLite.prototype.loop = function() {
	var _args = _.toArray(arguments);
	var loopFn = _args.pop();
	if (!_.isFunction(loopFn)) {
		throw new Error('SQLite: last argument of SQLite.loop must be a Function');
	}

	this.transform.apply(this, _args.concat(function(row) {
		var fieldNames = [];
		while (row && row.isValidRow() === true) {
			var obj = {};
			for (var i = 0; i < row.fieldCount; i++) {
				fieldNames[i] = fieldNames[i] || row.fieldName(i);
				obj[fieldNames[i]] = row.field(i);
			}
			loopFn(obj);
			row.next();
		}
	}));
};

module.exports = SQLite;
