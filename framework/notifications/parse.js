/**
 * @class  	Notifications.Parse
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var HTTP = require('T/http');

var app_id = Ti.App.Properties.getString('parse.appid');
var rest_api_key = Ti.App.Properties.getString('parse.restapikey');
var gcm_sender_id = Ti.App.Properties.getString('gcm.senderid');

exports.subscribe = function(opt) {
	if (app_id == null) throw new Error("Notifications.Parse: Invalid Parse application ID. Set it in your tiapp.xml");
	if (rest_api_key == null) throw new Error("Notifications.Parse: Invalid REST API key. Set it in your tiapp.xml");
	if (gcm_sender_id == null) throw new Error("Notifications.Parse: Invalid GCM sender ID. Set it in your tiapp.xml");

	HTTP.send({
		url: 'https://api.parse.com/1/installations',
		method: 'POST',
		headers: {
			'X-Parse-Application-Id': app_id,
			'X-Parse-REST-API-Key': rest_api_key,
			'Content-Type': 'application/json'
		},
		data: JSON.stringify((function() {
			if (OS_IOS) {
				return {
					deviceType: 'ios',
					deviceToken: opt.deviceToken,
					channels: [ opt.channel || "" ],
				};
			} else if (OS_ANDROID) {
				return {
					deviceType: 'android',
					pushType: 'gcm',
					deviceToken: opt.deviceToken,
					GCMSenderId: gcm_sender_id,
					channels: [ opt.channel || "" ],
				};
			}
		})()),
		success: opt.success,
		error: opt.error,
		errorAlert: false,
		silent: true
	});
};

exports.unsubscribe = function(opt) {
	if (app_id == null) throw new Error("Notifications.Parse: Invalid Parse application ID. Set it in your tiapp.xml");
	if (rest_api_key == null) throw new Error("Notifications.Parse: Invalid REST API key. Set it in your tiapp.xml");
	if (gcm_sender_id == null) throw new Error("Notifications.Parse: Invalid GCM sender ID. Set it in your tiapp.xml");

	HTTP.send({
		url: 'https://api.parse.com/1/installations',
		method: 'DELETE',
		headers: {
			'X-Parse-Application-Id': app_id,
			'X-Parse-REST-API-Key': rest_api_key,
			'Content-Type': 'application/json'
		},
		data: JSON.stringify((function() {
			if (OS_IOS) {
				return {
					deviceType: 'ios',
					deviceToken: opt.deviceToken,
					channels: [ opt.channel || "" ],
				};
			} else if (OS_ANDROID) {
				return {
					deviceType: 'android',
					pushType: 'gcm',
					deviceToken: opt.deviceToken,
					GCMSenderId: gcm_sender_id,
					channels: [ opt.channel || "" ],
				};
			}
		})()),
		success: opt.success,
		error: opt.error,
		errorAlert: false,
		silent: true
	});
};