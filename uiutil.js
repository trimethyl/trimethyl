/*

UI-Util module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

exports.ListView = {

	createFromCollection: function(C, opt) {
		var sec = [];
		var array = [];

		if (opt.groupBy) {
			if (C instanceof Backbone.Collection) {
				array = C.groupBy(opt.groupBy);
			} else {
				array = _.groupBy(C, opt.groupBy);
			}
		} else {
			if (C instanceof Backbone.Collection) {
				array = C.toJSON();
			} else {
				array = C;
			}
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

		return sec;
	}

};