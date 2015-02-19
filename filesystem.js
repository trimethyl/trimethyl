/**
* @class   Filesystem
* @author  Andrea Jonus <andrea.jonus@caffeinalab.com>
*/

/**
 * @method listDirectory
 * Lists the content of a directory.
 * Returns a list of objects with the structure `{path: "", content: []}`
 *
 * Returns null if the specified path does not point to an existing directory.
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
 * Returns a list of objects with the structure {path: "", content: []}
 *
 * Returns null if the specified path does not point to an existing directory.
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
