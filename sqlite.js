/**
 * @class  SQLite
 * @author Flavio De Stefano <flavio.destefano@caffeinalab.com>
 *
 * SQLite abstraction layer
 *
 */

function SQLite(name, file) {
	if (!(this instanceof SQLite)) {
		return new SQLite(name, file);
	}

	if (file == null) {
		this.db = Ti.Database.open(name);
	} else {
		this.db = Ti.Database.install(file, name);
	}
}

/**
 * @method execute
 * Execute a query
 * @param {String} query
 * @param {Vararg} values
 * @return {Ti.DB.ResultSet}
 */
SQLite.prototype.execute = function() {
	return Function.prototype.apply.call(this.db.execute, this.db, arguments);
};

/**
 * @method get
 * Return a single value
 * @param {String} query
 * @param {Vararg} values
 */
SQLite.prototype.value = function() {
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
SQLite.prototype.single = function() {
	var row = this.execute.apply(this, arguments);
	if (row.validRow === false) return {};
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
SQLite.prototype.list = function() {
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
SQLite.prototype.all = function() {
	var row = this.execute.apply(this, arguments);
	var list = [];
	while (row.validRow === true) {
		var obj = {};
		for (var i = 0; i < row.fieldCount; i++) {
			obj[row.fieldName(i)] = row.field(i);
		}
		list.push(obj);
		row.next();
	}
	return list;
};


module.exports = SQLite;
