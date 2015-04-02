/**
* @class   Filesystem
* @author  Andrea Jonus <andrea.jonus@caffeinalab.com>
* @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
*/

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
 * @method listDirectoryRecursive
 * Lists the content of a directory and all its subdirectories.
 * Returns a list of objects with the structure `{path: "", content: []}`
 *
 * Returns `null` if the specified path does not point to an existing directory.
 *
 * @param {String}	the path of the directory
 */
exports.listDirectoryRecursive = function(path) {
	var file = Ti.Filesystem.getFile(path);
	if (!file.isDirectory()) {
		return null;
	}

	return recursiveIterator(file);
};

/**
 * @method move
 * Move a file or a directory to a new path. Overwrite the destination path if the flag is set to true.
 *
 * Returns true if the operation was successful.
 *
 * @param {String}		the path of the file/directory to move
 * @param {String}		the destination path
 * @param {Boolean}		set to true to overwrite destination path
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
 * @method  getSize
 * Get the size of a directory in bytes
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
