/**
 * @class  SQLite
 * @author Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {Boolean} [config.log=false]
 */
exports.config = _.extend({
	log: false
}, Alloy.CFG.T ? Alloy.CFG.T.sqlite : {});

var Util = require('T/util');

function SQLite(name, file) {
	this.query = null;

	if (file == null) {
		this.db = Ti.Database.open(name);
	} else {
		this.db = Ti.Database.install(file, name);
	}
}

/**
 * @static
 * @method  fromFile
 * Return a new instance of SQLite opened from an absolute file
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
		return new SQLite(destination_file.resolve());
	}
};

/**
 * @method table
 * Start a chain to query informations
 * @param  {String} name The table name
 * @return {SQLite}
 */
SQLite.prototype.table = function(name) {
	this.query = {
		method: '',
		table: name,
		where: [],
		whereData: [],
		select: null,
		update: null,
		updateData: []
	};
	return this;
};

/**
 * @method select
 * Select attributes
 * @return {SQLite}
 */
SQLite.prototype.select = function() {
	if (this.query === null) throw new Error('Start a query chain with .table() method');

	this.query.method = 'select';

	var args = _.toArray(arguments);
	if (args.length > 1) {
		this.query.select = _.object(args, args);
	} else {
		if (_.isArray(args[0])) this.query.select = _.object(args[0], args[0]);
		else if (_.isObject(args[0])) this.query.select = args[0];
		else this.query.select = _.object([args[0]], [args[0]]);
	}

	return this;
};

/**
 * @method update
 * Update attributes.
 * @param  {Object} obj
 * @return {SQLite}
 */
SQLite.prototype.update = function(obj) {
	if (this.query === null) throw new Error('Start a query chain with .table() method');

	this.query.method = 'update';
	this.query.update = _.keys(obj);
	this.query.updateData = _.values(obj);

	return this;
};

/**
 * @method delete
 * Perform a delete table.
 * @return {SQLite}
 */
SQLite.prototype.delete = function() {
	if (this.query === null) throw new Error('Start a query chain with .table() method');

	this.query.method = 'delete';

	return this;
};

/**
 * @method truncate
 * Perform a truncate table.
 * @return {[SQLite}
 */
SQLite.prototype.truncate = function() {
	if (this.query === null) throw new Error('Start a query chain with .table() method');

	this.query.method = 'truncate';

	return this;
};

/**
 * @method andWhere
 * Add where clauses.
 * @return {SQLite}
 */
SQLite.prototype.andWhere = function() {
	if (this.query === null) throw new Error('Start a query chain with .table() method');

	var args = _.toArray(arguments);
	if (args.length === 1) {
		this.query.where.push(args[0]);
	} else if (args.length === 2) {
		this.query.where.push(args[0] + ' = ?');
		this.query.whereData.push(args[1]);
	} else if (args.length === 3) {
		this.query.where.push(args[0] + ' ' + args[1] + ' ?');
		this.query.whereData.push(args[2]);
	}

	return this;
};

/**
 * @method getExequery
 * @return {[type]} [description]
 */
SQLite.prototype.getExequery = function() {
	if (this.query === null) throw new Error('Start a query chain with .table() method');

	var whereClause = (this.query.where.length > 0 ? (' WHERE ' + this.query.where.join(' AND ')) : '');
	switch (this.query.method) {

		case 'select':
		return [
			'SELECT ' + (this.query.select === null ? '*' : _.map(this.query.select, function(v, k){ return k + ' AS ' + v; }).join(',')) +
			' FROM ' + this.query.table +
			whereClause
		]
		.concat(this.query.whereData);
		break;

		case 'update':
		return [
			'UPDATE ' + this.query.table +
			' SET ' + (this.query.update.join(' = ?, ') + ' = ?') +
			whereClause
		]
		.concat(this.query.updateData)
		.concat(this.query.whereData);
		break;

		case 'delete':
		return [
			'DELETE FROM ' + this.query.table +
			whereClause
		]
		.concat(this.query.whereData);
		break;

		case 'truncate':
		return [
			'TRUNCATE TABLE ' + this.query.table
		];
		break;

	}
};


/**
 * @method close
 * Close the database
 */
SQLite.prototype.close = function() {
	try {
		this.db.close();
	} catch (ex) {
		Ti.API.error('SQLite: error while closening database');
	}
};

/**
 * @method execute
 * Execute a query
 * @param {String} query
 * @param {Vararg} values
 * @return {Ti.DB.ResultSet}
 */
SQLite.prototype.execute = SQLite.prototype.exec = function() {
	if (this.query === null) {
		if (exports.config.log) Ti.API.debug('SQLite:', arguments);
		return Function.prototype.apply.call(this.db.execute, this.db, arguments);
	}

	var q = this.getExequery();
	this.query = null; // Reset query
	if (exports.config.log) Ti.API.debug('SQLite:', q);
	return Function.prototype.apply.call(this.db.execute, this.db, q);
};

/**
 * @method value
 * Return a single value
 * @param {String} query
 * @param {Vararg} values
 */
SQLite.prototype.value = SQLite.prototype.val = function() {
	var row = this.execute.apply(this, arguments);
	if (row.validRow === false) return null;

	return row.field(0);
};

/**
 * @method single
 * Return a single object (row)
 * @param {String} query
 * @param {Vararg} values
 */
SQLite.prototype.single = SQLite.prototype.row = function() {
	var row = this.execute.apply(this, arguments);
	if (row.validRow === false) return null;

	var obj = {};
	for (var i = 0; i < row.fieldCount; i++) {
		obj[row.fieldName(i)] = row.field(i);
	}
	return obj;
};

/**
 * @method list
 * Return a list of single values
 * @param {String} query
 * @param {Vararg} values
 */
SQLite.prototype.list = SQLite.prototype.array = function() {
	var row = this.execute.apply(this, arguments);
	var list = [];
	while (row.validRow === true) {
		list.push(row.field(0));
		row.next();
	}
	return list;
};

/**
 * @method all
 * Return a list of objects (row)
 * @param {String} query
 * @param {Vararg} values
 */
SQLite.prototype.all = SQLite.prototype.rows = function() {
	var row = this.execute.apply(this, arguments);
	var list = [];
	var fieldNames = [];
	while (row.validRow === true) {
		var obj = {};
		for (var i = 0; i < row.fieldCount; i++) {
			fieldNames[i] = fieldNames[i] || row.fieldName(i);
			obj[fieldNames[i]] = row.field(i);
		}
		list.push(obj);
		row.next();
	}
	return list;
};

/**
 * @method loop
 * Loop over query
 * @param {String} query
 * @param {Vararg} values
 */
SQLite.prototype.loop = function() {
	var _arguments = _.toArray(arguments);
	var loopFn = _arguments.pop();
	if (!_.isFunction(loopFn)) {
		throw new Error('SQLite: last argument of SQLite.loop must be a Function');
	}

	var row = this.execute.apply(this, _arguments);
	var fieldNames = [];
	while (row.validRow === true) {
		var obj = {};
		for (var i = 0; i < row.fieldCount; i++) {
			fieldNames[i] = fieldNames[i] || row.fieldName(i);
			obj[fieldNames[i]] = row.field(i);
		}
		loopFn(obj);
		row.next();
	}
};

module.exports = SQLite;
