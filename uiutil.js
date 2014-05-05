/*

UI-Util module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var config = _.extend({}, Alloy.CFG.uiutil);

exports.ListView = {

	createFromCollection: function(C, opt, $ui) {
		var array = [];
		var sec = [];

		if (opt.groupBy) {

			if (_.isFunction(opt.groupBy)) {
				if (C instanceof Backbone.Collection) {
					array = C.groupBy(opt.groupBy);
				} else {
					array = _.groupBy(C, opt.groupBy);
				}
			} else {
				array = C;
			}

			_.each(array, function(els, key){
				var dataset = [];
				_.each(els, function(el){
					dataset.push(opt.datasetCb(el));
				});

				var s = Ti.UI.createListSection({ items: dataset });

				if (opt.headerViewCb) {
					s.headerView = opt.headerViewCb(key);
				} else {
					s.headerTitle = key;
				}

				sec.push(s);
			});

			if ($ui && opt.sectionIndex) {
				var sit = [];
				_.each(_.keys(array), function(u,k){
					sit.push({ title: u, index: k });
				});
				$ui.sectionIndexTitles = sit;
			}

		} else {

			if (C instanceof Backbone.Collection) {
				array = C.toJSON();
			} else {
				array = C;
			}

			var dataset = [];
			_.each(array, function(el){
				dataset.push(opt.datasetCb(el));
			});

			sec = [ Ti.UI.createListSection({ items: dataset }) ];
		}

		if ($ui) {
			$ui.sections = sec;
		} else {
			return sec;
		}

	}

};