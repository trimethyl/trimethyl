var args = arguments[0] || {};

var selectA = T('uifactory').createSelect({
	columns: [
		[1,2,3,4],
		[
		{title:'alpha',value:'a'},
		'b',
		'c'
		]
	],
	columnsValues: [1,'b'],
	left: 20,
	right: 20,
	top: 20,
	color: '#000',
	borderColor: '#888',
	backgroundColor: '#eee'
});

selectA.addEventListener('change', function(e) {
	Ti.API.info('Changed A', e.value);
});

$.win.add( selectA );

var selectB = T('uifactory').createSelect({
	values: [
		{ title: 'Frog', value: 'frog' },
		'dog',
		'cow'
	],
	value: 'cow',
	left: 20,
	right: 20,
	top: 20,
	color: '#000',
	borderColor: '#888',
	backgroundColor: '#eee'
});

selectB.addEventListener('change', function(e) {
	Ti.API.info('Changed B', e.value);
});

$.win.add( selectB );

var selectDate = T('uifactory').createSelect({
	type: 'date',
	value: new Date('2015-12-12'),
	left: 20,
	right: 20,
	top: 20,
	color: '#000',
	borderColor: '#888',
	backgroundColor: '#ddd'
});

selectDate.addEventListener('change', function(e) {
	Ti.API.info('Changed Date', e.value);
});

$.win.add( selectDate );