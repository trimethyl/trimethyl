var args = arguments[0] || {};

var selectA = T('uifactory').createSelect({
	columns: [
		[1,2,{title:'3',value:3},4],
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
		{ title: 'null value', value: null },
		{ title: 'Frog', value: 'frog' },
		'dog',
		'cow'
	],
	left: 20,
	hintText: 'Test',
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

var btn = Ti.UI.createButton({
	title: 'Test setValue'
});
btn.addEventListener('click', function(e) {
	selectA.setColumnsValues([ 2,'b' ]);
	selectB.setValue('cow');
});

$.win.add(btn);