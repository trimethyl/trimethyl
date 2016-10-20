/**
 * @author Ani Sinanaj
 * @module xmlparser
 * @dependencies: xmlparser/extract, xmlparser/proxies
 */

/**
 * Dependencies
 */
var Extract = require('T/xmlparser/extract');
var DefaultProxies = require('T/xmlparser/proxies');

/**
 * Global variables
 */
var viewCount = 0; // just a counter to have the number of created views
var customProxies = {};
var container = null;

/**
 * Expose `parse`.
 */
exports = parse;

/**
 * Public methods
 */

// Use this method to set your own proxies
exports.overrideProxies = function(p) {
	_.extend(customProxies, p);
};

// Use this method to set your own container view
exports.setContainer = function(view) {
	container = view;
};

// A getter for the container
exports.getContainer = function() {
	return container;
};

/**
 * Setting type constants
 */
exports.TYPE_TEXT = 0;
exports.TYPE_CUSTOM = 1;

/**
 * Parse the given string of `xml`.
 *
 * @param {String} xml
 * @return {Object}
 * @api public
 */
function parse(xml, opts) {
	opts = opts || {};
	var fontTransform = _.extend({
		italic: {
			fontStyle: 'italic'
		},
		bold: {
			fontWeight: 'bold'
		}
	}, opts.fontTransform);

	DefaultProxies.opts = opts;
	DefaultProxies.fontTransform = fontTransform;

	var proxies   = _.extend(DefaultProxies.proxies, customProxies, opts.proxies);

	container = opts.container || container || Ti.UI.createScrollView({layout: "vertical", height: Ti.UI.SIZE, width: Ti.UI.SIZE});
	var currentLabel; // variable to use for constucting multi style labels
	var tempAttributes = [];

	this.container = container;

	// strip comments and whitespaces
	xml = xml.trim();
	xml = xml.replace(/<!--[\s\S]*?-->/g, '').replace(new RegExp("\\n" ,"g"), '<br />');

	// start processing
	tag(xml);

	//finalize currentLabel if it's not null
	finalizeLabel();

	// return container view
	return container;


	/**
	 * Tag.
	 */
	function tag(data) {
		var re = /^<([\w-:.]+)\s*/;
		var m = re.exec(data);

		// starts with simple text, could have children later
		if (!m) {
			// check if there are children
			var c = /<([\w-:.]+)\s*/.exec(data);
			var text = data;

			if(c != null && c[0] != null) {
				// split, process, loop
				text = text.substr(0,c.index);
				data = data.substr(c.index);

			} else {
				data = "";
			}

			proxy({
				name: "span",
				attributes: {},
				start: 0,
				end: data.length,
				text: text,
				content: data
			}); // create proxy

			// loop
			if(0 != data.length) tag(data);
			return;
		}

		// case when content starts with a child
		var block 	= Extract(data,m[1]);
		var child 	= re.exec(block.content);
		var content = block.content;

		// if the block has at least a child, iterate in it.
		data = data.replace(data.slice(block.start, block.end - block.start), '');
		if (!!child) {
			proxy(block); // create proxy
			tag(block.content);
		}

		// if the block doesn't have a child but has text
		if (!child && !!content.length) {
			if (block.text.length != block.content.length) {
				proxy(_.extend(_.clone(block), {text: "", content: ""}));
				tag(block.content);
			} else {
				proxy(block); // create proxy
			}
		}
		if (!child && ! content.length) proxy(block);
		tag(data);

		return;
	}

	/**
	 * Strip.
	 */

	function strip(val) {
		return val.replace(/^['"]|['"]$/g, '');
	}

	/**
	 * .
	 */

	function proxy(element) {
		viewCount++;
		if (null == proxies[element.name]) element.name = "span";

		if (proxies[element.name].type == exports.TYPE_TEXT && _.isFunction(proxies[element.name].handler)) {
			if (null == currentLabel) currentLabel = {text: "", attributes: []};

			var t = proxies[element.name].handler(element, container);
			currentLabel.text += t.text;
			// fix t.attributes ranges
			cascadingAttributes(t, element);
		}

		if (proxies[element.name].type == exports.TYPE_CUSTOM && _.isFunction(proxies[element.name].handler)) {
			// check if currentLabel is null
			finalizeLabel();

			return proxies[element.name].handler(element, container);
		}
	}

	function cascadingAttributes(e, element) {
		if (e.text == "") {
			tempAttributes = concatAttributes(tempAttributes, e.attributes);
		} else {
			var start = currentLabel.text.length - e.text.length, length = e.text.length;
			tempAttributes = concatAttributes(tempAttributes, e.attributes);

			_.each(tempAttributes, function(a) {
				a.range = [start, length];
				currentLabel.attributes.push(a);
			});

			if(element.content.length == element.text.length) tempAttributes = [];
		}
	}

	function concatAttributes(haystack, needles) {
		var attrs = [];
		_.each(haystack, function(attr) {
			_.each(needles, function(needle, index) {
				if (attr.type == needle.type) {
					switch(attr.type) {
						case Ti.UI.ATTRIBUTE_FONT:
							attr.value = _.extend(attr.value, needle.value);
							needles.splice(index,1);
							break;
					}
				}
			});
		});
		return haystack.concat(needles);
	}

	function finalizeLabel() {
		if (currentLabel == null) return;

		// add attributedString to label
		var label = Ti.UI.createLabel(_.extend({
			attributedString: Ti.UI.createAttributedString(currentLabel),
			font: {fontSize: 14}
		}, opts.textStyle));

		label.addEventListener("link", linkHandler);
		// add label to container
		container.add(label);
		currentLabel = null;
	}

	function linkHandler(e) {
		if (e.url) alert(e.url);
	}
}
