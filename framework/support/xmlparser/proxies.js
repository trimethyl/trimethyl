/**
 * @author Ani Sinanaj
 * @module support/xmlparser/proxies
 */

exports.TYPE_TEXT 		= 0;
exports.TYPE_CUSTOM 	= 1;
exports.opts 	  		= {};
exports.fontTransform 	= exports.opts.fontTransform || {};

exports.proxies = {
	p: {
		type: exports.TYPE_TEXT,
		handler: function(e) {
			return { text: e.text + "\n\n", attributes: [] };
		}
	},
	br: {
		type: exports.TYPE_TEXT,
		handler: function(e) {
			return { text: "\n", attributes: [] };
		}
	},
	h3: {
		type: exports.TYPE_TEXT,
		handler: function(e) {
			return { text: "\n" + e.text + "", attributes: [{
				type: Ti.UI.ATTRIBUTE_FONT,
				value: _.extend({}, exports.opts.font, {fontSize: 22})
			}] };
		}
	},
	strong: {
		type: exports.TYPE_TEXT,
		handler: function(e) {
			var attr = {
				type: Ti.UI.ATTRIBUTE_FONT,
				value: _.extend({}, exports.opts.font, exports.fontTransform.bold)
			};

			return { text: e.text, attributes: [attr] };
		}
	},
	a: {
		type: exports.TYPE_TEXT,
		handler: function(e) {
			var attr = {
				type: Ti.UI.ATTRIBUTE_LINK,
				value: e.attributes.href
			};

			return { text: e.text, attributes: [attr] };
		}
	},
	i: {
		type: exports.TYPE_TEXT,
		handler: function(e) {
			var attr = {
				type: Ti.UI.ATTRIBUTE_FONT,
				value: _.extend({}, exports.opts.font, exports.fontTransform.italic)
			};

			return { text: e.text, attributes: [attr] };
		}
	},
	u: {
		type: exports.TYPE_TEXT,
		handler: function(e) {
			var attr = {
				type: Ti.UI.ATTRIBUTE_UNDERLINES_STYLE,
				value: Ti.UI.ATTRIBUTE_UNDERLINE_STYLE_SINGLE
			};

			return { text: e.text, attributes: [attr] };
		}
	},
	em: {
		type: exports.TYPE_TEXT,
		handler: function(e) {
			var attr = {
				type: Ti.UI.ATTRIBUTE_FONT,
				value: _.extend({}, exports.opts.font, exports.fontTransform.italic)
			};

			return { text: e.text, attributes: [attr] };
		}
	},
	b: {
		type: exports.TYPE_TEXT,
		handler: function(e) {
			var attr = {
				type: Ti.UI.ATTRIBUTE_FONT,
				value: _.extend({}, exports.opts.font, exports.fontTransform.bold)
			};

			return { text: e.text, attributes: [attr] };
		}
	},
	span: {
		type: exports.TYPE_TEXT,
		handler: function(e) {
			return { text: e.text, attributes: [] };
		}
	}
};
