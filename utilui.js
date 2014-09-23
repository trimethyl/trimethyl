/**
 * @class  	Util.UI
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */


/**
 * @type {Object}
 */
var config = _.extend({
}, Alloy.CFG.T.utilui);
exports.config = config;


/**
 * @method populateListViewFromCollection
 * Parse an array or a Backbone.Collection and populate a ListView with this values.
 *
 * @param  {Array} 	C   	Array or Backbone.Collection to parse
 * @param  {Object} 	opt
 *
 * ### datasetCb
 *
 * You must provide a callback to fill the ListItem, like this:
 *
 * ```
 * return {
 *	   properties: {
 *	      height: 52,
 *			itemId: el.id,
 *			searchableText: el.get('city')
 *		},
 *		title: { text: el.get('title') },
 *		address: { text: el.get('address')+', '+el.get('city') }
 *	}
 * ```
 *
 * ### [groupBy]
 *
 * See `_.groupBy`
 *
 * ### [headerViewCb]
 *
 * A callback to generate the headerView for the ListView.
 *
 * ### [sectionIndex]
 *
 * If `true`, provide the **alphabet on the right** functionality.
 *
 * @param  {Ti.UI.ListView} [$ui]
 * The ListView to populate. If is not specified, return the elements instead populating directly.
 *
 * @return {Array}
 */
exports.populateListViewFromCollection = function(C, opt, $ui) {
	var array = [];
	var sec = [];

	if (opt.groupBy != null) {

		array = C instanceof Backbone.Collection ? C.groupBy(opt.groupBy) : _.groupBy(C, opt.groupBy);
		_.each(array, function(els, key){
			var dataset = [];
			_.each(els, function(el){
				dataset.push(opt.datasetCb(el));
			});

			var s = Ti.UI.createListSection({ items: dataset });
			if (_.isFunction(opt.headerViewCb)) s.headerView = opt.headerViewCb(key);
			else s.headerTitle = key;

			sec.push(s);
		});

		if ($ui != null && opt.sectionIndex != null) {
			var sit = [];
			_.each(_.keys(array), function(u,k){
				sit.push({ title: u, index: k });
			});
			$ui.sectionIndexTitles = sit;
		}

	} else {

		array = C instanceof Backbone.Collection ? C.toJSON() : C;
		var dataset = [];
		_.each(array, function(el){
			dataset.push(opt.datasetCb(el));
		});

		sec = [ Ti.UI.createListSection({ items: dataset }) ];
	}

	if ($ui != null) $ui.sections = sec;

	return sec;
};


/**
 * @method alert
 * Create and show an Alert Dialog
 *
 * @param  {String}   title    The title
 * @param  {String}   msg      The message
 * @param  {Function} [callback] The callback to invokie when clicking **OK**
 * @return {Ti.UI.AlertDialog}
 */
function alertDialog(title, msg, callback) {
	var dialog = Ti.UI.createAlertDialog({
		title: title,
		message: msg,
		ok: L('OK')
	});

	if (_.isFunction(callback)) {
		dialog.addEventListener('click', callback);
	}

	dialog.show();
	return dialog;
}
exports.alert = alertDialog;


/**
 * @method simpleAlert
 * Create and show an Alert Dialog that show only a message
 *
 * @param  {String}   msg The message
 * @param  {Function} cb  The callback
 * @return {Ti.UI.AlertDialog}
 */
exports.simpleAlert = function(msg, cb) {
	if (OS_IOS) return alertDialog(null, msg, cb);
	return alertDialog(Ti.App.name, msg, cb);
};


/**
 * @method prompt
 * Create and show a prompt dialog
 *
 * @param  {String}   title       	The title
 * @param  {String}   msg         	The message
 * @param  {Array}    [buttons]     The buttons to show
 * @param  {Number}   [cancelIndex] Cancel index for buttons
 * @param  {Function} [callback]    The callback to invoke when clicking on a button. The index of the button is passed.
 * @param  {Object}   [opt]         Additional options for `Ti.UI.createAlertDialog`
 * @return {Ti.UI.AlertDialog}
 */
function alertPrompt(title, msg, buttons, cancelIndex, callback, opt) {
	var dialog = Ti.UI.createAlertDialog(_.extend({
		cancel: cancelIndex,
		buttonNames: buttons,
		message: msg,
		title: title
	}, opt));

	dialog.addEventListener('click', function(e){
		if (OS_IOS && e.index == cancelIndex) return;
		if (OS_ANDROID && e.cancel === true) return;
		if (_.isFunction(callback)) callback(e.index);
	});

	dialog.show();
	return dialog;
}
exports.prompt = alertPrompt;


/**
 * @method confirm
 * Create and show a confirm dialog with *Cancel* and *Yes* button.
 *
 * @param  {String}   title 				The title
 * @param  {String}   msg   				The message
 * @param  {Function} [callback]    	The callback to invoke when clicking *Yes*.
 * @return {Ti.UI.AlertDialog}
 */
function confirm(title, msg, callback) {
	return alertPrompt(title, msg, [ L('Cancel'), L('Yes') ], 0, callback, { selectedIndex: 1 });
}
exports.confirm = confirm;


/**
 * @method  confirmCustom
 * Create and show a confirm dialog with *Cancel* and a custom button.
 *
 * @param  {String}   	title 				The title
 * @param  {String}   	msg   				The message
 * @param  {String}   	btnTitle 			The custom button title
 * @param  {Function} 	[callback]    		The callback to invoke when clicking your custom button title.
 * @return {Ti.UI.AlertDialog}
 */
exports.confirmCustom = function(title, msg, btnTitle, callback) {
	return alertPrompt(title, msg, [ L('Cancel'), btnTitle ], 0, callback, { selectedIndex: 1 });
};


/**
 * @method  option
 * Create and show an Option Dialog.
 *
 * @param  {Array}   	options     	The options to show, as Array of Strings.
 * @param  {Number}   	cancelIndex 	The cancelIndex.
 * @param  {Function} 	callback    	Callback to invoke. The index of the selected index is passed.
 * @param  {Object}   	opt         	Additionals options for `Ti.UI.createOptionDialog`
 * @return {Ti.UI.OptionDialog}
 */
function optionDialog(options, cancelIndex, callback, opt) {
	if (OS_ANDROID && cancelIndex>=0) { options.splice(cancelIndex,1); }
	var dialog = Ti.UI.createOptionDialog(_.extend({
		options: options,
		cancel: cancelIndex
	}, opt));

	dialog.addEventListener('click', function(e){
		if (OS_IOS && e.index == cancelIndex) return;
		if (OS_ANDROID && e.cancel === true) return;
		if (_.isFunction(callback)) callback(e.index);
	});

	dialog.show();
	return dialog;
}
exports.option = optionDialog;


/**
 * @method optionWithDict
 * Create and show an Option Dialog.
 *
 * It's an helper function for @{@link #option} method.
 *
 * Automatically add a *Cancel* cancelIndexed button.
 *
 * The `dict` argument must be in the form:
 *
 * ```javascript
 * [
 * 	{ title: 'Option one', callback: function(){ ... } },
 * 	{ title: 'Option two', callback: function(){ ... } },
 * 	...
 * ]
 * ```
 *
 * @param  {Array} 	dict 	The dictionary
 * @return {Ti.UI.OptionDialog}
 */
function optionDialogWithDict(dict) {
	var options = _.pluck(dict, 'title');
	options.push(L('Cancel'));
	return optionDialog(options, options.length-1, function(i){
		if (dict[+i] != null && _.isFunction(dict[+i].callback)) {
			dict[+i].callback();
		}
	});
}
exports.optionWithDict = optionDialogWithDict;


/**
 * Show an Error Dialog.
 *
 * The title is automatically *Error*, i18n compatible.
 *
 * @param  {String}   msg      		The message
 * @param  {Function} [callback] 	The callback to invoke.
 * @return {Ti.UI.AlertDialog}
 */
function alertError(msg, callback) {
	return alertDialog(L('Error', 'Error'), msg, callback);
}
exports.alertError = exports.error = alertError;


