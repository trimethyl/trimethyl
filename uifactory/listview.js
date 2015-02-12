/**
 * @class  	UIFactory.ListView
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

module.exports = function(args) {
	args = args || {};

	var $this = Ti.UI.createListView(args);

	var DBL_CLICK_TIMEOUT = 500;
	var devtClick = {};
	var devtTime = 0;

	$this.addEventListener('itemclick', function(e){
		var evtTime = Date.now();
		var evtClick = {
			itemId: e.itemId,
			bindId: e.bindId,
			sectionIndex: e.sectionIndex,
			itemIndex: e.itemIndex
		};

		if (evtTime - devtTime < DBL_CLICK_TIMEOUT && _.isEqual(devtClick, evtClick)) {
			evtClick.section = e.section;

			/**
			 * @event itemdblclick
			 * Similar to itemclick, but for double **item** click
			 */
			$this.fireEvent('itemdblclick', evtClick);
			evtClick = {}; // prevent non 2n-clicks
		}
		devtTime = evtTime;
		devtClick = evtClick;
	});

	return $this;
};