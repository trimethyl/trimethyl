/**
 * @module  uifactory/tabbedbar
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

module.exports = function(args) {
	args = args || {};
	_.defaults(args, {
		height: 34,
		tintColor: '#000',
		labelStyle: {},
		borderColor: args.tintColor,
		borderWidth: 1,
		borderRadius: 10
	});

	var $this = Ti.UI.createView(args);

	var labels = [];
	var labelIndex = 0;
	var UIWrapLabels = null;

	$this.getLabels = function() {
		return labels;
	};

	$this.setLabels = function(lbls) {
		labels = [];
		_.each(lbls, function(l) {
			labels.push(_.isObject(l) ? l.title : l);
		});

		var width = Math.floor(100 / labels.length);
		var latest_width = width + (100 - (width * labels.length));

		var $wrap = Ti.UI.createView({
			layout: 'horizontal',
		});

		_.each(labels, function(title, index) {
			var lblArgs = _.extend({
				color: $this.color || $this.tintColor,
				font: $this.font,
			}, $this.labelStyle, {
				title: title,
				index: index,
				// we have to fix the latest width because and floor(100/3)*3 = 99 < 100 
				width: (index == labels.length-1 ? latest_width : width) + '%', 
				height: Ti.UI.FILL,
				left: 0,
				right: -1
			});

			$wrap.add(Ti.UI.createButton(lblArgs));
		});

		if (UIWrapLabels !== null) $this.remove(UIWrapLabels);
		$this.add($wrap);
		UIWrapLabels = $wrap;
	};

	$this.getIndex = function() {
		return labelIndex;
	};

	$this.setIndex = function(i) {
		i = parseInt(i, 10);
		if (!_.isNumber(i)) {
			Ti.API.error('UIFactory.Tabbedbar: new index value is not a number');
			return;
		}

		labelIndex = +i;
		_.each(UIWrapLabels && UIWrapLabels.children ? UIWrapLabels.children : [], function($c, i) {
			if (+i === labelIndex) {
				$c.applyProperties({
					backgroundColor: $this.tintColor,
					color: $this.activeColor || $this.backgroundColor || '#fff',
					active: false
				});
			} else {
				$c.applyProperties({
					backgroundColor: 'transparent',
					color: $this.color || $this.tintColor,
					active: true
				});
			}
		});
	};

	//////////////////////
	// Parse arguments //
	//////////////////////

	$this.addEventListener('click', function(e){
		if (e.source.index == null) return;
		$this.setIndex(+e.source.index);
	});

	if (args.labels != null) $this.setLabels(args.labels);
	$this.setIndex(args.index || 0);

	return $this;
};