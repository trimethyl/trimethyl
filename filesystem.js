/* 
* @class   Filesystem
* @author  Andrea Jonus <andrea.jonus@caffeinalab.com>
*/

/**
 * @method listDir
 * Lists the content of a directory.
 * Returns a list of objects with the structure {path: "", content: []}
 *
 * Returns null if the specified path does not point to an existing directory.
 *
 * @param {String}	the path of the directory
 */
exports.listDir = function(path) {
	var file = Ti.Filesystem.getFile(path);
	if (file.isDirectory()) {
		var dirArray = file.getDirectoryListing();
		var dirList = [];

		_.each(dirArray, function(item, index) {
			var curFile = Ti.Filesystem.getFile(item);
			dirList.push({
				path: curFile.getNativePath(),
				content:[]
			});
		});

		return dirList;

	} else {
		return null;
	}

	return null;
};

function recDesc(file) {
	var dirArray = file.getDirectoryListing();
	var dirList = [];

	_.each(dirArray, function(item, index) {
		var curFile = Ti.Filesystem.getFile(item);
		dirList.push({
			path: curFile.getNativePath(),
			content: curFile.isDirectory() ? recDesc(curFile) : []
		});
	});

	return dirList;
}

/**
 * @method listDir
 * Lists the content of a directory and all its subdirectories.
 * Returns a list of objects with the structure {path: "", content: []}
 *
 * Returns null if the specified path does not point to an existing directory.
 *
 * @param {String}	the path of the directory
 */
exports.listDirRecursive = function(path) {
	var file = Ti.Filesystem.getFile(path);
	if (file.isDirectory()) {
		return recDesc(file);
	} else {
		return null;
	}
};