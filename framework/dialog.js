/**
 * @module  dialog
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */


function parseDict(dict) {
	return {
		cancel: _.indexOf(dict, _.findWhere(dict, { cancel: true })),
		preferred: _.indexOf(dict, _.findWhere(dict, { preferred: true })),
		destructive: _.indexOf(dict, _.findWhere(dict, { destructive: true })),
	};
}

function onClickDict(e, dict, dialog) {
	if (OS_IOS && e.index == e.source.cancel) return;
	if (OS_ANDROID && e.cancel === true) return;

	if (dict != null && _.isObject(dict[+e.index]) && _.isFunction(dict[+e.index].callback)) {
		dict[+e.index].callback.call(dialog, e);
	}
}

/**
 * Create and show an Alert Dialog
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
 * Create and show a confirm dialog
 *
 * @param  {String}		title       	The title
 * @param  {String}		message        The message
 * @param  {Object}		dict     		Buttons as Dictionary
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
 * Create and show an Option Dialog
 *
 * @param  {String}		title 			The title
 * @param  {Object}    	dict 				Buttons as Dictionary
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
			preferred: true
		}
	]);
}
exports.confirmYes = confirmYes;


/**
 * Create a prompt dialog.
 *
 * @param  {String}   	title 				The title
 * @param  {String}   	message   			The message
 * @param  {Object}    	dict 					Buttons as Dictionary
 * @param  {Object}		[ext] 				Extends the `AlertDialog`
 * @return {Ti.UI.AlertDialog}
 */
function dialogPrompt(title, message, dict, ext) {
	if (OS_IOS) {

		return dialogConfirm(title, message, dict, _.extend({
			style: Ti.UI.iOS.AlertDialogStyle.PLAIN_TEXT_INPUT
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

/**
 * Create a checkbox prompt dialog.
 * Android only.
 *
 * @param  {String}   	[title] 	The title.
 * @param  {String}   	[message]   The message.
 * @param  {Object}   	[options] 	The options as an Array of primitive values or Literal objects with title/value. Title can be a primitive or a Literal object of Ti.UI.Label options.
 * @param  {Object}   	[values] 	A list of preselected values.
 * @param  {Object}   	[dict] 		Buttons as Dictionary.
 * @param  {Object}		[ext] 		Extends the `AlertDialog`. The property androidView is ignored.
 * @return {Ti.UI.AlertDialog}
 */
function dialogCheckbox(title, message, options, values, dict, ext) {
	if (OS_IOS) {

		Ti.API.error('Dialog: Dialog.checkbox is not supported yet on iOS');
		return false;

	} else if (OS_ANDROID) {

		var container = Ti.UI.createView({
			width: Ti.UI.FILL,
			height: Ti.UI.SIZE
		});

		var inner_container = Ti.UI.createView({
			width: Ti.UI.FILL,
			height: Ti.UI.SIZE,
			top: _.isEmpty(message) ? 20 : 0,
			bottom: _.isEmpty(dict) ? 24 : 0,
			left: 24,
			right: 24,
			layout: 'vertical'
		});

		values = values || [];

		_.each(options, function(item) {
			var value = _.isObject(item) ? item.value : item;
			var title = _.isObject(item) ? item.title : item;

			var item_container = Ti.UI.createView({
				width: Ti.UI.FILL,
				height: 48
			});

			item_container.input = Ti.UI.createSwitch({
				style: Ti.UI.Android.SWITCH_STYLE_CHECKBOX,
				value: values.indexOf(value) >= 0 ? true : false,
				width: Ti.UI.SIZE,
				left: 0,
			});
			item_container.add(item_container.input);

			item_container.add(Ti.UI.createLabel(_.extend({
				left: 36,
				width: Ti.UI.FILL
			}, _.isObject(title) ? title : { text: title })));

			item_container.value = value;

			inner_container.add(item_container);
		});

		container.add(inner_container);

		_.each(dict, function(d) {
			if (d.cancel === true || d.callback == null) return;
			d._origCallback = d.callback;
			d.callback = function(e) {
				var values = [];

				_.each(inner_container.children, function(item) {
					if (item.input.getValue() == true) {
						values.push(item.value);
					}
				});
				_.extend(e, {
					values: values
				});

				d._origCallback.call(this, e);
			};
		});

		return dialogConfirm(title, message, dict, _.extend({
			androidView: container
		}, _.omit(ext, 'androidView')));

	}
}
exports.checkbox = dialogCheckbox;
