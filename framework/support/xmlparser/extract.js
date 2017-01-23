/**
 * @author Ani Sinanaj
 * @module support/xmlparser/extract
 */

/**
 * Expose `extract`.
 */
exports.extract = extract;

/**
 * Parse the given string of `xml`.
 *
 * @param {String} xml
 * @param {String} tag to extract
 * @return {Object}
 */
function extract(xml, tagName) {
	// strip spaces
	//xml = xml.trim();
	// strip comments
	xml = xml.replace(/<!--[\s\S]*?-->/g, '').replace("\n", '');
	var attributesStr = "";

	return tag();

	/**
	 * Tag.
	 */

	function tag() {
		var reOpening = new RegExp('<' + tagName + '([\\w-:.]*)\\s*',"gm");
	 	var openTag = reOpening.exec(xml);
	 	var closeTag = closingTag(tagName);

	 	xml = xml.substr(openTag.index, closeTag.index + closeTag[0].length - openTag.index);

		if (!m) return;

		// name
		var node = {
			name: tagName,
			attributes: {},
			start: openTag.index,
			end: closeTag.index + closeTag[0].length,
			text: ""
		};

		// attributes
		attributesStr = xml.substring(openTag.index, /\>/.exec(xml).index);
		while (strip(attributesStr).length) {
			var attr = attribute();
			if (!attr) break;
			node.attributes[attr.name] = attr.value;
		}

		// self closing tag
		if (openTag.index === closeTag.index) {
			node.content = "";
			return node;
		}

		match(/\w*?>/);

		// content
		node.content = xml.replace(new RegExp(closeTag[0]+"$"), '');
		node.text = /([^<]*)/.exec(xml)[0];
		return node;
	}

	/**
	 * Attribute.
	 */

	function attribute() {
		var m = /([\w:-]+)\s*=\s*("[^"]*"|'[^']*'|\w+)\s*/.exec(attributesStr);
		if (!m) return;
		attributesStr = attributesStr.replace(m[0], '');
		return { name: m[1], value: strip(m[2]) };
	}

	/**
	 * Strip quotes from `val`.
	 */

	function strip(val) {
		return val.replace(/^['"]|['"]$/g, '');
	}

	/**
	 * Match `re` and advance the string.
	 */

	function match(re) {
		var m = xml.match(re);
		if (!m) return;
		xml = xml.slice(m[0].length + m.index);
		return m;
	}

	/**
	 *	Find the closing tag
	 */

	 function closingTag(tag) {
	 	var reString = '<[\\/]*'+ tag +'[^>]*>';
	 	var re = new RegExp(reString,"g");

	 	var i = 0;
	 	var counter = 0;

	 	m = re.exec(xml);

	 	if (m[0].indexOf("/>") != -1) return m;

	 	while (m && i < 1000) {
			if (m[0].indexOf("</") != -1) {
	 			counter--;
	 		} else {
	 			counter ++;
	 		}

	 		if (counter == 0) return m;

	 		m = re.exec(xml);
	 		i++;
	 	}
	 }

	/**
	 * End-of-source.
	 */

	function eos() {
		return 0 == xml.length;
	}

	/**
	 * Check for `prefix`.
	 */

	function is(prefix) {
		return 0 == xml.indexOf(prefix);
	}
}