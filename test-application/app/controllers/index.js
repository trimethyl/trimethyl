var Q = T('ext/q');

var UT = require('unit-tests');
UT.labels = {};
UT.toTest = [];
UT.uiRows = {};
UT.uiSections = {};

function buildUI(section, key) {
	var text = key.split('_').join(' ');

	if (UT.uiSections[section] == null) {
		UT.uiSections[section] = Ti.UI.createTableViewSection({
			headerTitle: section
		});
		$.list.appendSection(UT.uiSections[section]);
	}

	var row = Ti.UI.createTableViewRow({
		height: 24
	});
	row._text = Ti.UI.createLabel({
		left: 10,
		right: 50,
		text: text,
		font: {fontSize:12}
	});
	row.add(row._text);

	row._loader = Ti.UI.createActivityIndicator({
		right: 10,
		style: Ti.UI.ActivityIndicatorStyle.DARK,
	});
	row.add(row._loader);

	row._label = Ti.UI.createLabel({
		right: 10,
		opacity: 0,
		font: {fontWeight:'bold',fontSize:12}
	});
	row.add(row._label);

	UT.uiRows[key] = row;
	UT.uiSections[section].add(row);
}

function doNextTest() {
	var key = UT.toTest.shift();
	if (key == null) return;

	Ti.API.debug('Testing ' + key);
	
	UT.uiRows[key[1]]._loader.show();
	UT.uiRows[key[1]]._label.opacity = 0;

	UT.methods[ key[0] ][ key[1] ]()
	.then(function(res) {
		Ti.API.debug('Result ' + key, res);

		UT.uiRows[key[1]]._label.applyProperties({ text: 'OK', color: 'green', opacity: 1 });
		UT.uiRows[key[1]]._loader.hide();
	})
	.catch(function(err) {
		Ti.API.error('Error ' + key);
		Ti.API.error(err.message ? err.message : err);

		UT.uiRows[key[1]].error = err;
	
		UT.uiRows[key[1]]._label.applyProperties({ text: 'FAIL', color: 'red', opacity: 1 });
		UT.uiRows[key[1]]._loader.hide();
	})
	.fin(function() {
		doNextTest();
	});
}

// Configure UI tests

$.list.addEventListener('click', function(e) {
	if (e.rowData.error) {
		alert(e.rowData.error);
	}
});

$.testsBtn.addEventListener('click', function(e) {
	UT.toTest = [];
	_.each(UT.methods, function(methods, section) {
		_.each(methods, function(fn, key) {
			UT.toTest.push([section,key]);
		});
	});
	doNextTest();
});

$.uiList.addEventListener('click', function(e) {
	$.uiTab.open(
		Alloy.createController(e.row.title.toLowerCase()).getView()
	);
});

_.each(UT.methods, function(methods, section) {
	_.each(methods, function(fn, key) {
		buildUI(section, key);
	});
});

$.tab.open();