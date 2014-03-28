/*

UI module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var config = {};

exports.ListView = {

	createFromCollection: function(C, opt) {
		var sec = [];
		_.each(C.groupBy(function(e){
			return e.get(opt.groupBy);

		}), function(els, key){

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

exports.init = function(c) {
	config = _.extend(config, c);
};