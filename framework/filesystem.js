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
 * Writes the specified data to a file, after checking storage permissions. This operation is asynchronous.
 * @param {Titanium.Filesystem.File} file 						The file to modify
 * @param {String/Titanium.Filesystem.File/Titanium.Blob} data 	Data to write, as a String, Blob or File object.
 * @param {Function} [success] 									The callback to invoke on success.
 * @param {Function} [error] 									The callback to invoke on error.
 * @param {Boolean} [append] 									If true, append the data to the end of the file.
 * @see {@link http://docs.appcelerator.com/platform/latest/#!/api/Titanium.Filesystem.File-method-write}
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

/**
 * Creates a directory, after checking storage permissions. This operation is asynchronous.
 * @param {Titanium.Filesystem.File} file 						The file object that identifies the directory to create.
 * @param {Function} [success] 									The callback to invoke on success.
 * @param {Function} [error] 									The callback to invoke on error.
 * @see {@link http://docs.appcelerator.com/platform/latest/#!/api/Titanium.Filesystem.File-method-createDirectory}
 */
exports.createDirectory = function(file, success, error) {
	success = _.isFunction(success) ? success : Alloy.Globals.noop;
	error = _.isFunction(error) ? error : Alloy.Globals.noop;

	Permissions.requestStoragePermissions(function() {
		if (file.exists() && file.isDirectory()) {
			if (file.writable) {
				Ti.API.warn('Filesystem: directory already exists. Skipping.');
				success();
			} else {
				Ti.API.error('Filesystem: directory exists but is not writable.');
			}
		} else {
			var res = file.createDirectory();

			if (res) success();
			else error();
		}
	}, error);
}

/**
 * Deletes a directory, after checking storage permissions. This operation is asynchronous.
 * @param {Titanium.Filesystem.File} file 						The file object that identifies the directory to delete.
 * @param {Function} [success] 									The callback to invoke on success.
 * @param {Function} [error] 									The callback to invoke on error.
 * @param {Boolean} [recursive] 								Pass true to recursively delete any directory contents.
 * @see {@link http://docs.appcelerator.com/platform/latest/#!/api/Titanium.Filesystem.File-method-deleteDirectory}
 */
exports.deleteDirectory = function(file, success, error, recursive) {
	success = _.isFunction(success) ? success : Alloy.Globals.noop;
	error = _.isFunction(error) ? error : Alloy.Globals.noop;

	Permissions.requestStoragePermissions(function() {
			if (!file.exists()) {
				Ti.API.warn('Filesystem: directory does not exist. Skipping.');
				success();
			} else {
				if (file.writable) {
					var res = file.deleteDirectory(recursive);

					if (res) success();
					else error();
				} else {
					Ti.API.error('Filesystem: directory exists but is not writable.');
					error();
				}
			}
	}, error);
}
