/**
 * @class  	UIUtil
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */


/**
 * @method populateListViewFromCollection
 * Parse an array or a Backbone.Collection and populate a ListView with this values.
 *
 * @param {Object} 	C   					Array or Backbone.Collection
 * @param {Object} 	opt 					Options
 * @param {Function} opt.datasetCb		You must provide a callback to fill the ListItem, like this:
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
 * @param {Object}	opt.groupBy 		See `_.groupBy`
 * @param {Function} opt.headerViewCb	A callback to generate the headerView for the ListView.
 * @param {Boolean}	opt.sectionIndex 	If `true`, provide the **alphabet on the right** functionality.
 * @param {Ti.UI.ListView} 	[$ui] The ListView to populate.
 * @return {Array}
 */
exports.populateListViewFromCollection = function(C, opt, $ui) {
	var sec = [];

	if (opt.groupBy != null) {

		var array = (C instanceof Backbone.Collection) ? C.groupBy(opt.groupBy) : _.groupBy(C, opt.groupBy);
		sec = _.map(array, function(els, key) {
			return Ti.UI.createListSection(_.extend({
				items: _.map(els, opt.datasetCb),
			}, _.isFunction(opt.headerViewCb) ? { headerView: opt.headerViewCb(key) } : { headerTitle: key }));
		});

		if ($ui != null && opt.sectionIndex) {
			$ui.sectionIndexTitles = _.map(_.keys(array), function(u, k) {
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
* @method setBackgroundCoverForView
* Set the background image with cover method
* @param {String} url
*/
exports.setBackgroundCoverForView = function($this, url, w, h) {
	if (!_.isNumber(w) || !_.isNumber(h)) {
		$this.addEventListener('postlayout', function postlayout() {
			$this.removeEventListener('postlayout', postlayout);
			exports.setBackgroundCoverForView($this, url, $this.size.width, $this.size.height);
		});

		return false;
	}

	var ext = url.match(/\.(\w+)$/g);
	var hashedCachedName = Ti.Utils.md5HexDigest(url) + '_' + (w+'x'+h) + '.' + (ext && ext[1] ? ext[1] : 'jpg');
	var cachedFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationCacheDirectory, hashedCachedName);

	var onBlobReady = function(blob) {
		var status = require('T/image').process({
			blob: blob,
			width: w,
			height: h,
			retina: true,
			file: cachedFile
		});

		if (status) {
			$this.backgroundImage = cachedFile.nativePath;
		} else {
			Ti.API.error('UIFactory.View: Can\'t write cover file');
		}
	};

	if (cachedFile.exists()) {
		$this.backgroundImage = cachedFile.nativePath;

	} else {

		if (/\:\/\//.test(url)) {
			require('T/http').send({
				url: url,
				format: 'blob'
			}).success(function(data) {
				onBlobReady(data);
			}).error(function() {
				Ti.API.error('UIFactory.View: URL <' + url + '> can\'t be downloaded');
			});
		} else {
			var origFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, url);
			if (origFile.exists()) {
				onBlobReady(origFile.read());
			} else {
				Ti.API.error('UIFactory.View: File <' + url + '> doesn\'t exists');
			}
		}
	}

};
