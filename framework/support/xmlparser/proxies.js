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
			var attr = OS_IOS ? {
				type: Ti.UI.ATTRIBUTE_UNDERLINES_STYLE,
				value: Ti.UI.ATTRIBUTE_UNDERLINE_STYLE_SINGLE
			} : {};

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
	},
	li: {
		type: exports.TYPE_CUSTOM,
		end: function(container) {
			container.addTo = null;
		},
		handler: function(e, container) {
			var left = exports.opts.textStyle.left || 0;
			var right = exports.opts.textStyle.right || 0;

			var row = Ti.UI.createView({width: Ti.UI.FILL, height: Ti.UI.SIZE, layout: "composite"});
			var bullet = Ti.UI.createLabel({
				text: "• ", left: left, top: 2,
				font: exports.opts.font
			});
			row.add(bullet);

			var rightView = Ti.UI.createView({height: Ti.UI.SIZE, left: 20, top: OS_IOS ? 5 : 0, right: 0});
			row.add(rightView);

			if (e.text) {
				var attrs = OS_IOS ? Ti.UI.createAttributedString({text: e.text, attributes: [{
					type: Ti.UI.ATTRIBUTE_KERN,
					value: exports.opts.characterSpacing,
					range: [0, e.text ? e.text.length : 0]
				},{
					type: Ti.UI.ATTRIBUTE_PARAGRAPH_STYLE,
					value: {
						lineSpacing: exports.opts.lineSpacing
					},
					range: [0, e.text ? e.text.length : 0]
				}]}) : null;

				var text = Ti.UI.createLabel({
					top: 0,
					attributedString: attrs,
					lineSpacing: !OS_IOS ? exports.opts.lineSpacing : null,
					left: 0, right: 0, height: Ti.UI.SIZE,
					font: exports.opts.textStyle ? exports.opts.textStyle.font : null
				});

				if (!OS_IOS) text.text = e.text;
				rightView.left = left + 20;
				rightView.right = right;

				rightView.add(text);
			}

			container.addTo = rightView;
			container.add(row);
		}
	}
};
