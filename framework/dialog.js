/**
 * @class  	Dialog
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */


function parseDict(dict) {
	return {
		cancel: _.indexOf(dict, _.findWhere(dict, { cancel: true })),
		selectedIndex: _.indexOf(dict, _.findWhere(dict, { selected: true })),
		destructive: _.indexOf(dict, _.findWhere(dict, { destructive: true })),
	};
}

function onClickDict(e, dict, dialog) {
	if (OS_IOS && e.index == e.source.cancel) return;
	if (OS_ANDROID && e.cancel === true) return;

	if (_.isObject(dict[+e.index]) && _.isFunction(dict[+e.index].callback)) {
		dict[+e.index].callback.call(dialog, e);
	}
}

/**
 * @method alert
 * Create and show an Alert Dialog
 *
 * @param  {String}		title    		The title
 * @param  {String}		message    		The message
 * @param  {Function}	[callback] 		The callback to invokie when clicking **OK**
 * @param  {Object}	 	[ext] 			Extends the `AlertDialog`
 * @return {Ti.UI.AlertDialog}
 */
function dialogAlert(title, message, callback, ext) {
	if (OS_ANDROID && _.isEmpty(title)) {
		title = Ti.App.name;
	}

	var dialog = Ti.UI.createAlertDialog(_.extend({
		title: title,
		message: message,
		ok: 'OK'
	}, ext));

	if (_.isFunction(callback)) {
		dialog.addEventListener('click', callback);
	}

	dialog.show();
	return dialog;
}
exports.alert = dialogAlert;


/**
 * @method confirm
 * Create and show a confirm dialog
 *
 * @param  {String}		title       	The title
 * @param  {String}		message        The message
 * @param  {Object}		dict     		Buttons as Dictonary
 * @param  {Object}		ext 				Extends the `AlertDialog`
 * @return {Ti.UI.AlertDialog}
 */
function dialogConfirm(title, message, dict, ext) {
	var dialog = Ti.UI.createAlertDialog(_.extend(parseDict(dict), {
		buttonNames: _.pluck(dict, 'title'),
		title: title,
		message: message
	}, ext));

	dialog.addEventListener('click', function(e) {
		onClickDict(e, dict, dialog);
	});

	dialog.show();
	return dialog;
}
exports.confirm = dialogConfirm;


/**
 * @method option
 * Create and show an Option Dialog
 *
 * @param  {String}		title 			The title
 * @param  {Object}    	dict 				Buttons as Dictonary
 * @param  {Object}		[ext] 			Extends the `AlertDialog`
 * @return {Ti.UI.AlertDialog}
 */
function dialogOption(title, dict, ext) {
	var pdict = parseDict(dict);
	if (OS_ANDROID && pdict.cancel !== -1) {
		// Android doesn't need a Cancel button, just hit "Back"
		dict.splice(pdict.cancel, 1);
	}

	var dialog = Ti.UI.createOptionDialog(_.extend(pdict, {
		options: _.pluck(dict, 'title'),
		title: title
	}, ext));

	dialog.addEventListener('click', function(e) {
		onClickDict(e, dict, dialog);
	});

	dialog.show();
	return dialog;
}
exports.option = dialogOption;


/**
 * @method confirmYes
 * Create and show a confirm dialog with *Cancel* and *Yes* button.
 *
 * @param  {String}   	title 				The title
 * @param  {String}   	message   			The message
 * @param  {Function} 	[callback]    		The callback to invoke when clicking *Yes*.
 * @param  {String}   	[buttonTitle]		Alternative title for *Yes*.
 * @return {Ti.UI.AlertDialog}
 */
function confirmYes(title, message, callback, buttonTitle) {
	return dialogConfirm(title, message, [
		{
			title: L('cancel', 'Cancel'),
			cancel: true
		},
		{
			title: buttonTitle || L('yes', 'Yes'),
			callback: callback,
			selected: true
		}
	]);
}
exports.confirmYes = confirmYes;


/**
 * @method prompt
 * Create a prompt dialog.
 *
 * @param  {String}   	title 				The title
 * @param  {String}   	message   			The message
 * @param  {Object}    	dict 					Buttons as Dictonary
 * @param  {Object}		[ext] 				Extends the `AlertDialog`
 * @return {Ti.UI.AlertDialog}
 */
function dialogPrompt(title, message, dict, ext) {
	if (OS_IOS) {

		return dialogConfirm(title, message, dict, _.extend({
			style: Ti.UI.iPhone.AlertDialogStyle.PLAIN_TEXT_INPUT
		}, ext));

	} else if (OS_ANDROID) {

		_.each(dict, function(d) {
			if (d.cancel === true || d.callback == null) return;
			d._origCallback = d.callback;
			d.callback = function(e) {
				_.extend(e, { text: this.androidView.value });
				d._origCallback.call(this, e);
			};
		});

		return dialogConfirm(title, message, dict, _.extend({
			androidView: Ti.UI.createTextField({
				value: (ext ? ext.value : '')
			})
		}, ext));

	}
}
exports.prompt = dialogPrompt;
