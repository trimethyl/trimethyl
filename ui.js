var config = {};

exports.ListView = {

	createFromCollection: function(C, groupBy, datasetCb) {
		var sec = [];
		_.each(C.groupBy(function(e){ return e.get(groupBy); }), function(els, key){
			var dataset = [];
			_.each(els, function(el){
				dataset.push(datasetCb(el));
			});
			sec.push(Ti.UI.createListSection({
				headerTitle: key,
				items: dataset
			}));
		});
		return sec;
	}

};

exports.init = function(c) {
	config = _.extend(config, c);
};