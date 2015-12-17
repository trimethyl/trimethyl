/**
 * @class  Spotlight
 * @author Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {String} [config.autoRoute=true]	Auto route from the searchableItemActivityIdentifier parameter
 */
exports.config = _.extend({
	autoRoute: true
}, Alloy.CFG.T ? Alloy.CFG.T.spotlight : {});

var Util = require('T/util');

exports.populateFromCollection = function(collection_name) {
	var defer = Q.defer();

	if (OS_ANDROID) {
		Ti.API.warn('Spotlight: Android not supported yet');
		defer.reject();
		return defer.promise;
	}

	if (Util.getIOSVersion() < 9) {
		Ti.API.warn('Spotlight: iOS version not supported', Util.getIOSVersion());
		defer.reject();
		return defer.promise;
	}

	var collection = Alloy.createCollection(collection_name);
	var identifier = Ti.App.id + '.' + collection_name;

	var searchableIndex = Ti.App.iOS.createSearchableIndex();
	searchableIndex.deleteAllSearchableItemByDomainIdenifiers([identifier], function() {

		collection.fetch({
			http: {
				silent: true,
				errorAlert: false
			},
			success: function() {

				var promises = collection.map(function(model) {
					return model.downloadPictureFilePromise();
				});

				Q.allSettled(promises).then(function() {

					var searchItems = collection.map(function(model) {
						return Ti.App.iOS.createSearchableItem({
							identifier: model.id,
							uniqueIdentifier: model.getRoute(),
							domainIdentifier: identifier,
							attributeSet: Ti.App.iOS.createSearchableItemAttributeSet({
								itemContentType: Ti.App.iOS.UTTYPE_PLAIN_TEXT,
								title: model.getTitle(),
								contentDescription: model.getDescription(),
								thumbnailData: model.getPictureFile().read()
							})
						});
					});

					searchableIndex.addToDefaultSearchableIndex(searchItems, function(e) {
						Ti.API.trace('Spotlight: population of ID ' + identifier, e);
						if (e.success) defer.resolve();
						else defer.reject(e.error);
					});
				});

			},
			error: defer.reject
		});
	});

	return defer.promise;
};

//////////
// Init //
//////////

if (exports.config.autoRoute) {
	Ti.App.iOS.addEventListener('continueactivity', function(e) {
		if (e.activityType !== 'com.apple.corespotlightitem') return;
		if (_.isEmpty(e.searchableItemActivityIdentifier)) return;
		Router.go(e.searchableItemActivityIdentifier);
	});
}