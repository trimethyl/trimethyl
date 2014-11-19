/**
 * @class  SQLite
 * @author Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */


function SQLite(name, file) {
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
SQLite.prototype.execute = SQLite.prototype.exec = function() {
	return Function.prototype.apply.call(this.db.execute, this.db, arguments);
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


module.exports = SQLite;
