/**
 * @module  uiutil
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var Image = require('T/image');
var HTTP = require('T/http');

/**
 * Parse an array or a Backbone.Collection and populate a ListView with this values.
 *
 * @param {Object} C Array or Backbone.Collection
 * @param {Object} opt Options
 * @param {Function} opt.datasetCb You must provide a callback to fill the ListItem, like this:
 *
 * ```
 * return {
 *	   properties: {
 *	      height: 52,
 *			itemId: el.id,
 *			searchableText: el.get('city')
 *		},
 *		title: { text: el.get('title') },
 *		address: { text: el.get('address')+', '+el.get('city') }
 *	}
 * ```
 *
 * @param {Object} opt.groupBy See `_.groupBy`
 * @param {Function} opt.headerViewCb A callback to generate the headerView for the ListView.
 * @param {Boolean} opt.sectionIndex If `true`, provide the **alphabet on the right** functionality.
 * @param {Ti.UI.ListView} [$ui] The ListView to populate.
 * @return {Array}
 */
exports.populateListViewFromCollection = function(C, opt, $ui) {
	var sec = [];

	if (opt.groupBy != null && opt.groupBy != false) {

		var array = (C instanceof Backbone.Collection) ? C.groupBy(opt.groupBy) : ( _.isArray(C) ? _.groupBy(C, opt.groupBy) : C );
		sec = _.map(array, function(els, key) {
			var hViewExtend = _.isFunction(opt.headerViewCb) ? { headerView: opt.headerViewCb(key) } : { headerTitle: key };

			return Ti.UI.createListSection(_.extend({
				items: _.map(els, opt.datasetCb),
			}, hViewExtend));
		});

		if (OS_IOS && $ui != null && opt.sectionIndex == true) {
			$ui.sectionIndexTitles = _.map(Object.keys(array), function(u, k) {
				return {
					title: u,
					index: k
				};
			});
		}

	} else {
		sec = [ Ti.UI.createListSection({
			items: (C instanceof Backbone.Collection) ? C.map(opt.datasetCb) : _.map(C, opt.datasetCb)
		}) ];
	}

	if ($ui != null) $ui.sections = sec;
	return sec;
};



/**
* Set the background image with cover method
* @param {String} url
*/
exports.setBackgroundCoverForView = function($this, url, callback) {
	if ($this.size == null || $this.size.width == 0 || $this.size.height == 0) {

		$this.addEventListener('postlayout', function postlayout() {
			$this.removeEventListener('postlayout', postlayout);
			if ($this.size != null && $this.size.width != 0 && $this.size.height != 0) {
				exports.setBackgroundCoverForView($this, url, callback);
			}
		});

		return;
	}

	var filename = null;
	if (_.isString(url)) {
		filename = url;
	} else {
		filename = url.name;
	}

	var w = $this.size.width, h = $this.size.height;
	var hashedCachedName = Ti.Utils.md5HexDigest(filename) + '_' + (w+'x'+h) + '.png';
	var cachedFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationCacheDirectory, hashedCachedName);

	var onBlobReady = function(blob) {
		// Cache the file to avoid future calls
		Ti.Filesystem.getFile(Ti.Filesystem.applicationCacheDirectory).createDirectory();

		var cachedFileStatus = Image.process({
			blob: blob,
			width: w,
			height: h,
			retina: true,
			file: cachedFile
		});

		if (cachedFileStatus != false && cachedFileStatus.nativePath) {
			callback(cachedFileStatus.nativePath);
		} else {
			Ti.API.error('UIUtil: Can\'t write cover file for url <' + url + '>');
		}
	};

	if (cachedFile.exists()) {
		callback(cachedFile.nativePath);

	} else {

		if (_.isString(url) && /^https?\:\/\//.test(url)) {
			HTTP.send({
				url: url,
				format: 'blob',
				cache: false,
				refresh: true,
				silent: true
			}).success(function(data) {
				onBlobReady(data);
			}).error(function() {
				Ti.API.error('UIUtil: URL <' + url + '> can\'t be downloaded');
			});

		} else {

			var tiFile = null;

			if (_.isString(url)) {
				if (OS_ANDROID) url = url.replace(/^\//, '');
				tiFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, url);
			} else {
				tiFile = url;
			}

			if (tiFile.exists()) {
				var blob = tiFile.read();
				if (blob != null) {
					onBlobReady(blob);
				} else {
					Ti.API.error('UIUtil: File <' + url + '> exists but is unreadable');
				}
			} else {
				Ti.API.error('UIUtil: File <' + url + '> doesn\'t exists');
			}
		}

	}

};

/**
 * Build a Toolbar
 * @return {Ti.UI.iOS.Toolbar}
 */
exports.buildKeyboardToolbar = function(opt) {
	var $doneBtn = Ti.UI.createButton({
		title: L('done', 'Done'),
		style: Ti.UI.iPhone.SystemButtonStyle.DONE
	});
	$doneBtn.addEventListener('click', opt.done);

	var $cancelBtn = Ti.UI.createButton({
		title: L('cancel', 'Cancel'),
	});
	$cancelBtn.addEventListener('click', opt.cancel);

	return Ti.UI.iOS.createToolbar({
		borderTop: true,
		borderBottom: true,
		items:[
		$cancelBtn,
		Ti.UI.createButton({ systemButton: Ti.UI.iPhone.SystemButton.FLEXIBLE_SPACE }),
		$doneBtn
		]
	});
};
