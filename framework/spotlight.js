/**
 * @module  spotlight
 * @author 	Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {String} [config.enqueueRoute=true]	Enqueue route from the searchableItemActivityIdentifier parameter
 */
exports.config = _.extend({
 	enqueueRoute: true
}, Alloy.CFG.T ? Alloy.CFG.T.spotlight : {});

var Util = require('T/util');
var Router = require('T/router');


/**
 * @param {Object} opt
 * @param {Object} opt.collection The collection
 * @param {String} opt.id The id of this collection
 * @param {Function} [opt.uniqueIdentifierCallback]
 * @param {Function} [opt.attributeSetCallback]
 */
exports.populateFromCollection = function(opt) {
	var defer = Q.defer();

	if (OS_ANDROID) {
		Ti.API.warn('Spotlight: Android not supported yet');
		defer.reject();
		return defer.promise;
	}

	if (!_.isFunction(Ti.App.iOS.createSearchableIndex)) {
		Ti.API.warn('Spotlight: Searchable index not found');
		defer.reject();
		return defer.promise;
	}

	var searchableIndex = Ti.App.iOS.createSearchableIndex();
	searchableIndex.deleteAllSearchableItemByDomainIdenifiers([ opt.id ], function() {
		var searchItems = opt.collection.map(function(model) {
			var exUid = _.isFunction(opt.uniqueIdentifierCallback) ? opt.uniqueIdentifierCallback(model) : {};
			var exSet = _.isFunction(opt.attributeSetCallback) ? opt.attributeSetCallback(model) : {};

			return Ti.App.iOS.createSearchableItem({
				identifier: model.id,
				domainIdentifier: opt.id,
				
				uniqueIdentifier: JSON.stringify(_.extend({
					id: model.id,
					route: _.isFunction(model.getRoute) ? model.getRoute() : null
				}, exUid)),
				
				attributeSet: Ti.App.iOS.createSearchableItemAttributeSet(_.extend({
					itemContentType: Ti.App.iOS.UTTYPE_PLAIN_TEXT,
					title: _.isFunction(model.getTitle) ? model.getTitle() : '',
					contentDescription: _.isFunction(model.getDescription) ? model.getDescription() : null,
					thumbnailURL: _.isFunction(model.getPictureURL) ? model.getPictureURL() : null
				}, exSet))

			});
		});

		searchableIndex.addToDefaultSearchableIndex(searchItems, function(e) {
			Ti.API.trace('Spotlight: population of ID ' + opt.id, e);
			if (e.success) defer.resolve();
			else defer.reject(e.error);
		});

	});

return defer.promise;
};

//////////
// Init //
//////////

if (OS_IOS) {
	
	if (exports.config.enqueueRoute) {
		Ti.App.iOS.addEventListener('continueactivity', function(e) {
			if (e.activityType !== 'com.apple.corespotlightitem') return;

			var data = Util.parseJSON(e.searchableItemActivityIdentifier);
			Ti.API.trace('Spotlight: continue activity data', data);
			if (data != null && data.route != null) {
				Router.enqueue(data.route);
			}
		});
	}

}