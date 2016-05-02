/**
* @module  filesystem
* @author  Andrea Jonus <andrea.jonus@caffeina.com>
* @author  Flavio De Stefano <flavio.destefano@caffeina.com>
*/

var Permissions = require('T/permissions');

function recursiveIterator(file) {
	return _.map(file.getDirectoryListing(), function(item) {
		var curFile = Ti.Filesystem.getFile(file.nativePath, item);
		if (curFile.isDirectory()) {
			return {
				path: curFile.nativePath,
				content: recursiveIterator( curFile )
			};
		} else {
			return {
				path: curFile.nativePath
			};
		}
	});
}

/**
 * Lists the content of a directory and all its subdirectories.
 * Returns a list of objects with the structure `{path: "", content: []}`
 *
 * Returns `null` if the specified path does not point to an existing directory.
 *
 * @param {String} path
 */
exports.listDirectoryRecursive = function(path) {
	var file = Ti.Filesystem.getFile(path);
	if (!file.isDirectory()) {
		return null;
	}

	return recursiveIterator(file);
};

/**
 * Move a file or a directory to a new path. Overwrite the destination path if the flag is set to true.
 *
 * Returns true if the operation was successful.
 *
 * @param {String} src		the path of the file/directory to move
 * @param {String} dest		the destination path
 * @param {Boolean} ow 		set to true to overwrite destination path
 * @returns {Boolean}
 */
exports.move = function(src, dest, ow) {
	var srcFile = Ti.Filesystem.getFile(src);
	if (!srcFile.exists()) {
		return false;
	}

	var destFile = Ti.Filesystem.getFile(dest);
	if (ow === true && destFile.exists()) {
		destFile.deleteFile();
	}

	return srcFile.move(dest);
};

/**
 * Get the size of a directory in bytes
 * @param {String} path
 * @return {Number}
 */
exports.getSize = function(path) {
	var file = path.nativePath ? path : Ti.Filesystem.getFile(path);
	if (!file.isDirectory()) {
		return file.size;
	}

	return _.reduce(file.getDirectoryListing(), function(carry, f) {
		carry += exports.getSize( Ti.Filesystem.getFile(file.nativePath, f) );
		return carry;
	}, 0);
};

/**
 * Write content to a file after checking storage write permissions. This operation is asynchronous.
 * @param {Titanium.Filesystem.File} file 						The file to modify
 * @param {String/Titanium.Filesystem.File/Titanium.Blob} data 	Data to write, as a String, Blob or File object.
 * @param {Function} [success] 									The callback to invoke on success.
 * @param {Function} [error] 									The callback to invoke on error.
 * @param {Boolean} [append] 									If true, append the data to the end of the file.
 * @return {Boolean}
 */
exports.write = function(file, data, success, error, append) {
	success = _.isFunction(success) ? success : Alloy.Globals.noop;
	error = _.isFunction(error) ? error : Alloy.Globals.noop;

	Permissions.requestStoragePermissions(function() {
		var res = file.write(data, append);

		if (res) success();
		else error();
	}, error);
}
