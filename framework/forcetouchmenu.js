/**
 * @module  forcetouchmenu
 * @author  Ani Sinanaj <ani.sinanaj@caffeina.com>
 */

/**
 * This module manages the dynamically created forcetouch links
 * @uses Q
 * @uses Event
 * @uses !Router
 * @events forcetouch.menu.click thrown when a user clicks on a menu and the app is opened.
 * @property config
 * @property {Array}   config.items List of items to show in the menu
 * @property {Object}  config.items[] An object representing the force touch menu
 * @property {String}  config.items[].title The title/text of the menu
 * @property {String}  [config.items[].subtitle] The subtitle/text of the menu
 * @property {String}  config.items[].icon The icon of the menu (see Ti.UI.iOS constants) or local image
 * @property {String}  config.items[].type An identifier for the menu such as `it.caffeina.menu`
 * @property {Object}  config.items[].data Some userdata, usually the routes
 */
exports.config = _.extend({
	items: []
}, Alloy.CFG.T ? Alloy.CFG.T.forceTouchMenu : {});

var Event = require('T/event');
//var Util = require('T/util');
var Router = require('T/router');
var Q = require('T/ext/q');

// 3DTouch

var appShortcuts;

exports.addMenus = function(items) {
	if(items != undefined && items != null) exports.config.items = _.extend(exports.config.items, items);

	for(var i = 0; i < exports.config.items.length; i++)
		exports.addMenu(exports.config.items[i]);
	clickHandler();
};

exports.addMenu = function(menu) {
	if(!OS_IOS || !Ti.UI.iOS.forceTouchSupported) return;

	if(!appShortcuts) appShortcuts = Ti.UI.iOS.createApplicationShortcuts();
	if(appShortcuts.dynamicShortcutExists(menu.type)) appShortcuts.removeDynamicShortcut(menu.type);

	var ob = {
		title: menu.title || "",
		subtitle: menu.subtitle || "",
		icon: menu.icon || Titanium.UI.iOS.SHORTCUT_ICON_TYPE_HOME,
		itemtype: menu.type || "com.caffeina." + menu.title.replace(" ", "_"),
		userInfo: menu.data || {}
	};
	appShortcuts.addDynamicShortcut(ob);
};

exports.removeMenu = function(index) {
	if(!OS_IOS || !Ti.UI.iOS.forceTouchSupported) return;
	if(!appShortcuts) appShortcuts = Ti.UI.iOS.createApplicationShortcuts();

	removeShortcut(index);
};

exports.removeMenuByType = function(type) {
	if(!OS_IOS || !Ti.UI.iOS.forceTouchSupported) return;
	if(!appShortcuts) appShortcuts = Ti.UI.iOS.createApplicationShortcuts();

	if(appShortcuts.dynamicShortcutExists(menu.type)) appShortcuts.removeDynamicShortcut(menu.type);
};

exports.removeMenus = function() {
	if(!OS_IOS || !Ti.UI.iOS.forceTouchSupported) return;
	if(!appShortcuts) appShortcuts = Ti.UI.iOS.createApplicationShortcuts();

	removeShortcut();
};

/////////////////////
// Private methods //
/////////////////////

function removeShortcut() {
	var index = arguments[0];
	
	if(index && appShortcuts.dynamicShortcutExists(items[index]))
		appShortcuts.removeDynamicShortcut(items[index]);
	else 
		appShortcuts.removeAllDynamicShortcuts();
}

////////////////////////////
// Auto executing methods //
////////////////////////////

function clickHandler() {
	if(!OS_IOS) return;
	
	function respondToShortcut(e) {
		//Ti.API.info("Event Fired: ", JSON.stringify(e));
	    //Router.go(e.userInfo.route);
	    if(e.userInfo != null && e.userInfo.route != null) Router.go(e.userInfo.route);
	    Event.trigger("forcetouch.menu.click", e);
	}
	
	//Ti.App.iOS.removeEventListener('shortcutitemclick', respondToShortcut);
	Ti.App.iOS.addEventListener('shortcutitemclick', respondToShortcut);
}
