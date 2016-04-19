/**
 * @module  uifactory/label
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 *
 * Add support for very basic HTML.
 *
 * For now, supports `<b><i><u><br><p>` tags.
 *
 * If you specify `fontTransform` property in the arguments,
 * the specified transformation is applied to current font.
 * For example:
 *
 * ```
 * italic: {
 *		fontStyle: 'italic'
 *	},
 *	bold: {
 *		fontFamily: 'Arial-Bold'
 *	}
 *	```
 *
 * It's useful if you haven't a regular font syntax.
 *
 */

// Thanks to @lastguest: https://gist.github.com/lastguest/10277461
function simpleHTMLParser(text) {
	var tags_rx = /<\s*(\/?\s*[^>]+)(\s+[^>]+)?\s*>/gm, partial, tag, temp_style;
	var last_idx = 0, last_text_idx = 0;
	var style = [], style_stack = [], clean_text = [];

	while ((tag=tags_rx.exec(text))!==null) {
		partial = text.substr(last_idx, tag.index - last_idx);
		clean_text.push(partial);
		last_text_idx += partial.length;

		if (tag[1][0] === '/'){
			temp_style = style_stack.pop();
			temp_style.length = last_text_idx - temp_style.start;
			style.push(temp_style);
		} else {
			style_stack.push({
				type: tag[1],
				start: last_text_idx,
			});
		}
		last_idx = tags_rx.lastIndex;
	}

	clean_text.push(text.substr(last_idx));

	return {
		text: clean_text.join(''),
		style: style
	};
}

module.exports = function(args) {
	args = args || {};
	var $this = Ti.UI.createLabel(args);

	var fontTransform = _.extend({
		italic: {
			fontStyle: 'italic'
		},
		bold: {
			fontWeight: 'bold'
		}
	}, args.fontTransform);

	$this.addEventListener('link', function(e) {
		Ti.Platform.openURL(e.url);
	});

	/**
	 * Set the HTML
	* @param {String} value
	*/
	$this.setHtml = function(value, parser) {
		var htmlToAttrMap = {
			'u': {
				type: Ti.UI.ATTRIBUTE_UNDERLINES_STYLE,
				value: Ti.UI.ATTRIBUTE_UNDERLINE_STYLE_SINGLE
			},
			'i': {
				type: Ti.UI.ATTRIBUTE_FONT,
				value: _.extend({}, args.font, fontTransform.italic)
			},
			'em': {
				type: Ti.UI.ATTRIBUTE_FONT,
				value: _.extend({}, args.font, fontTransform.italic)
			},
			'b': {
				type: Ti.UI.ATTRIBUTE_FONT,
				value: _.extend({}, args.font, fontTransform.bold)
			},
			'strong': {
				type: Ti.UI.ATTRIBUTE_FONT,
				value: _.extend({}, args.font, fontTransform.bold)
			},
			'a': {
				type: Ti.UI.ATTRIBUTE_LINK
			}
		};

		value = value.replace(/<br\/?>/g, '\n');
		value = value.replace(/<p>/g, '').replace(/<\/p>/g, '\n\n');
		var parseResult = simpleHTMLParser(value);

		if (_.isFunction(parser)) {
			parseResult.text = parser( parseResult.text );
		}

		var attributedString = {
			text: parseResult.text,
			attributes: []
		};

		_.each(parseResult.style, function(v){
			// Replace href
			var vh = /\s*href=\\?"([^\\"]+)\\?"/i.exec(v.type); // NOTE: this regexp doesn't allow backslashes (\) in the url
			var href = null;
			if (vh) {
				v.type = v.type.replace(vh[0], '');
				href = vh[1];
			}

			if (htmlToAttrMap[v.type] != null) {
				attributedString.attributes.push(_.extend({}, htmlToAttrMap[v.type], {
					range: [ v.start, v.length ]
				}, href ? {
					value: href
				} : {}));
			}
		});

		$this.setAttributedString(Ti.UI.createAttributedString(attributedString));
	};

	//////////////////////
	// Parse arguments //
	//////////////////////

	if (args.html != null) $this.setHtml(args.html);

	return $this;
};
