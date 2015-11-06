var args = arguments[0] || {};

var select = T('uifactory').createSelect({
	columns: [
		[1,2,3,4],
		['a','b','c']
	],
	color: '#000',
	borderColor: '#000',
	backgroundColor: '#eee'
});

$.win.add( select );