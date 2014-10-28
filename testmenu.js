/**
 * @class  	TestMenu
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * * `showOnShake`: Show the menu on shake. Default: `true`
 * * `hockeyApp`: Load HockeyApp SDK. Default: `true`
 * @type {Object}
 */
var config = _.extend({
	showOnShake: true,
	hockeyApp: true
}, Alloy.CFG.T.testmenu);
exports.config = config;

if (config.hockeyApp === true) {
	var HA = require('nl.rebelic.hockeyapp');
	HA.start(T('prop').getString('hockeyapp.id'));
}

/**
 * @method show
 * Show the menu
 */
exports.show = function() {
	var opts = [];
	opts.push({
		title: 'Send screenshot via email',
		callback: function() {
			d.hide();
			Ti.Media.takeScreenshot(function(e) {
				var emailDialog = Ti.UI.createEmailDialog({
					subject: '[' + Ti.App.name + '] Feedback',
					toRecipients: [ T('prop').getString('support.email') ]
				});
				var reportInfo = JSON.stringify({
					device: T('device').getInfo(),
					app: _.pick(Ti.App, 'id', 'name', 'version', 'deployType', 'installId', 'sessionId')
				});
				var reportFile = Ti.Filesystem.getFile(T('util').getAppDataDirectory(), 'report.json');
				if (reportFile.write(reportInfo)) emailDialog.addAttachment(reportFile);
				emailDialog.addAttachment(e.media);
				emailDialog.open();
			});
		}
	});
	if (HA != null) {
		opts.push({
			title: 'Send feedback via HA',
			callback: function() {
				HA.showFeedbackListView();
			}
		});
	}
	opts.push({
		title: 'Ping API server',
		callback: function() {
			T('http').send({
				url: '',
				errorAlert: false,
				success: function() {
					T('dialog').alert('Is up! :)', null);
				},
				error: function(err) {
					T('dialog').alert('Is down :(', HTTP.config.base + '\n\n' + JSON.stringify(err));
				},
			});
		}
	});
	opts.push({
		title: 'Delete DB cache (~' + T('util').bytesForHumans(T('cache').getSize()) + ')',
		callback: function() {
			T('cache').prune();
			d.hide();
		}
	});
	opts.push({
		title: 'Cancel',
		cancel: true
	});

	var d = T('dialog').option(Ti.App.name+' v'+Ti.App.version+'\n'+Ti.App.id+'\nTESTING MENU', opts);
};

if (config.showOnShake === true) {
	Ti.Gesture.addEventListener('shake', exports.show);
}