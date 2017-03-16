/**
* @module  filesystem
* @author  Andrea Jonus <andrea.jonus@caffeina.com>
* @author  Flavio De Stefano <flavio.destefano@caffeina.com>
*/

/*
Include methods used in this module dynamically to avoid that Titanium 
static analysis doesn't include native-language methods.
 */
Ti.Filesystem;

var Permissions = require('T/permissions/storage');

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

function canWrite(file) {
	return (OS_IOS || (file.exists() && file.writable) || (OS_ANDROID && file.parent.writable));
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
 * @param {Object} opt
 * @param {Titanium.Filesystem.File} opt.file 						The file to modify
 * @param {String/Titanium.Filesystem.File/Titanium.Blob} opt.data 	Data to write, as a String, Blob or File object.
 * @param {Function} [opt.success] 									The callback to invoke on success.
 * @param {Function} [opt.error] 									The callback to invoke on error.
 * @param {Boolean} [opt.append] 									If true, append the data to the end of the file.
 * @see {@link http://docs.appcelerator.com/platform/latest/#!/api/Titanium.Filesystem.File-method-write}
 */
exports.write = function(opt) {
	_.defaults(opt, {
		append: false,
		success: Alloy.Globals.noop,
		error: Alloy.Globals.noop
	});

	function writeFile() {
		var res = opt.file.write(opt.data, !!opt.append);

		if (res) opt.success();
		else opt.error();
	}

	if (canWrite(opt.file)) {
		writeFile();
	} else {
		Permissions.request(writeFile, opt.error);
	}
};

/**
 * Creates a directory, after checking storage permissions. This operation is asynchronous.
 * @param {Object} opt
 * @param {Titanium.Filesystem.File} opt.file 	The file object that identifies the directory to create.
 * @param {Function} [opt.success] 				The callback to invoke on success.
 * @param {Function} [opt.error] 				The callback to invoke on error.
 * @see {@link http://docs.appcelerator.com/platform/latest/#!/api/Titanium.Filesystem.File-method-createDirectory}
 */
exports.createDirectory = function(opt) {
	_.defaults(opt, {
		success: Alloy.Globals.noop,
		error: Alloy.Globals.noop
	});

	function writeDir() {
		if (opt.file.exists() && opt.file.isDirectory()) {
			Ti.API.warn('Filesystem: directory already exists. Skipping.');
			opt.success();
		} else {
			var res = opt.file.createDirectory();

			if (res) opt.success();
			else opt.error();
		}
	}

	if (canWrite(opt.file)) {
		writeDir();
	} else {
		Permissions.request(writeDir, opt.error);
	}
};

/**
 * Deletes a directory, after checking storage permissions. This operation is asynchronous.
 * @param {Object} opt
 * @param {Titanium.Filesystem.File} opt.file 	The file object that identifies the directory to delete.
 * @param {Function} [opt.success] 				The callback to invoke on success.
 * @param {Function} [opt.error] 				The callback to invoke on error.
 * @param {Boolean} [opt.recursive] 			Pass true to recursively delete any directory contents.
 * @see {@link http://docs.appcelerator.com/platform/latest/#!/api/Titanium.Filesystem.File-method-deleteDirectory}
 */
exports.deleteDirectory = function(opt) {
	_.defaults(opt, {
		success: Alloy.Globals.noop,
		error: Alloy.Globals.noop
	});

	function deleteDir() {
		var res = opt.file.deleteDirectory(opt.recursive);

		if (res) opt.success();
		else opt.error();
	}

	if (canWrite(opt.file)) {
		if (!opt.file.exists()) {
			Ti.API.warn('Filesystem: directory does not exist. Skipping.');
			opt.success();
		} else {
			deleteDir();
		}
	} else {
		Permissions.request(deleteDir, opt.error);
	}
};
