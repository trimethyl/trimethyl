/**
* @class   Filesystem
* @author  Andrea Jonus <andrea.jonus@caffeinalab.com>
*/

/**
 * @method listDirectory
 * Lists the content of a directory.
 * Returns a list of objects with the structure `{path: "", content: []}`
 *
 * Returns `null` if the specified path does not point to an existing directory.
 *
 * @param {String}	the path of the directory
 */
exports.listDirectory = function(path) {
	var file = Ti.Filesystem.getFile(path);
	if (!file.isDirectory()) {
		return null;
	}

	return _.map(file.getDirectoryListing(), function(item) {
		return {
			path: Ti.Filesystem.getFile(item).getNativePath(),
			content:[]
		};
	});
};

function recursiveDesc(file) {
	return _.map(file.getDirectoryListing(), function(item) {
		var curFile = Ti.Filesystem.getFile(item);
		return {
			path: curFile.getNativePath(),
			content: curFile.isDirectory() ? recursiveDesc(curFile) : []
		};
	});
}

/**
 * @method listDirectory
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

	return recursiveDesc(file);
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
	if (ow == true && destFile.exists()) {
		destFile.deleteFile();
	}

	return srcFile.move(dest);
};