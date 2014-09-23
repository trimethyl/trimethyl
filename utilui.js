/**
 * @class  	Util.UI
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */


/**
 * @type {Object}
 */
var config = _.extend({
}, Alloy.CFG.T.utilui);
exports.config = config;


/**
 * @method populateListViewFromCollection
 * Parse an array or a Backbone.Collection and populate a ListView with this values.
 *
 * @param  {Array} 	C   	Array or Backbone.Collection to parse
 * @param  {Object} 	opt
 *
 * ### datasetCb
 *
 * You must provide a callback to fill the ListItem, like this:
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
 * ### [groupBy]
 *
 * See `_.groupBy`
 *
 * ### [headerViewCb]
 *
 * A callback to generate the headerView for the ListView.
 *
 * ### [sectionIndex]
 *
 * If `true`, provide the **alphabet on the right** functionality.
 *
 * @param  {Ti.UI.ListView} [$ui]
 * The ListView to populate. If is not specified, return the elements instead populating directly.
 *
 * @return {Array}
 */
exports.populateListViewFromCollection = function(C, opt, $ui) {
	var array = [];
	var sec = [];

	if (opt.groupBy != null) {

		array = C instanceof Backbone.Collection ? C.groupBy(opt.groupBy) : _.groupBy(C, opt.groupBy);
		_.each(array, function(els, key){
			var dataset = [];
			_.each(els, function(el){
				dataset.push(opt.datasetCb(el));
			});

			var s = Ti.UI.createListSection({ items: dataset });
			if (_.isFunction(opt.headerViewCb)) s.headerView = opt.headerViewCb(key);
			else s.headerTitle = key;

			sec.push(s);
		});

		if ($ui != null && opt.sectionIndex != null) {
			var sit = [];
			_.each(_.keys(array), function(u,k){
				sit.push({ title: u, index: k });
			});
			$ui.sectionIndexTitles = sit;
		}

	} else {

		array = C instanceof Backbone.Collection ? C.toJSON() : C;
		var dataset = [];
		_.each(array, function(el){
			dataset.push(opt.datasetCb(el));
		});

		sec = [ Ti.UI.createListSection({ items: dataset }) ];
	}

	if ($ui != null) $ui.sections = sec;

	return sec;
};
