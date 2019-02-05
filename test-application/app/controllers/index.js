
var UT = require('unit-tests');
UT.labels = {};
UT.toTest = [];
UT.uiRows = {};
UT.uiSections = {};

FCM = require('T/firebase/cloudmessaging');

function buildUI(section, key) {
	var text = key.split('_').join(' ');

	if (UT.uiSections[section] == null) {
		UT.uiSections[section] = Ti.UI.createTableViewSection({
			headerTitle: section
		});
		$.list.appendSection(UT.uiSections[section]);
	}

	var row = Ti.UI.createTableViewRow({
		height: 40
	});
	row._text = $.UI.create('Label', {
		left: 10,
		right: 50,
		text: text,
		font: { fontSize: 14 }
	});
	row.add(row._text);

	row._loader = Ti.UI.createActivityIndicator({
		right: 10,
		style: Ti.UI.ActivityIndicatorStyle.DARK,
	});
	row.add(row._loader);

	row._label = $.UI.create('Label', {
		width: Ti.UI.SIZE,
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
		Ti.API.error(err && err.message ? err.message : err);

		UT.uiRows[key[1]].error = err;

		UT.uiRows[key[1]]._label.applyProperties({ text: 'FAIL', color: 'red', opacity: 1 });
		UT.uiRows[key[1]]._loader.hide();
	})
	.fin(function() {
		doNextTest();
	});
}

// Configure UI tests

function getErrorMessage(error) {
	var message = error;

	if (typeof error === 'object') {
		message = JSON.stringify(error, function(key, val) {
			if (typeof val !== 'object') {
				return val;
			}
			try {
				JSON.stringify(val);
				return val;
			} catch (err) {
				return undefined;
			}
		}, 4);
	}

	return message;
}

$.list.addEventListener('click', function(e) {
	if (e.rowData && e.rowData.error) {
		alert(getErrorMessage(e.rowData.error));
	} else if (e.row && e.row.error) {
		alert(getErrorMessage(e.row.error));
	}
});

function startTests() {
	UT.toTest = [];
	_.each(UT.methods, function(methods, section) {
		_.each(methods, function(fn, key) {
			UT.toTest.push([section,key]);
		});
	});
	doNextTest();
};

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

FCM.onReceived = function(e) {
	Ti.UI.createAlertDialog({
		title: "Notification Message Received",
		message: JSON.stringify(e)
	}).show();
};
FCM.onDataReceived = function(e) {
	Ti.UI.createAlertDialog({
		title: "Data Message Received",
		message: JSON.stringify(e)
	}).show();
};

$.tab.addEventListener("open", function() {
	if (FCM.areRemoteNotificationsEnabled()) {
		FCM.activate();
	}
});

$.tab.open();