var selectA = require('T/uifactory').createSelect({
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

var selectB = require('T/uifactory').createSelect({
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

var selectDate = require('T/uifactory').createSelect({
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

/////////////////////
// Automated tests //
/////////////////////

$.win.add($.UI.create('Label', {
	top: 20,
	left: 20,
	right: 20,
	height: 30,
	font: {
		fontSize: 20
	},
	text: 'AUTOMATED TESTS'
}));

// Set/Get test
var selectC = require('T/uifactory').createSelect({
	left: 20,
	hintText: 'Set/Get Test',
	right: 20,
	top: 20,
	color: '#000',
	borderColor: '#888',
	backgroundColor: '#eee',
	columns: [
		[{title: 'uno', value: 1},2,{title:'three',value:3},4],
		[
		{title:'alpha',value:'a'},
		'b',
		'c',
		{title:'gamma',value:'g'}
		]
	],
});

var set_get_result = $.UI.create('Label', {
	top: 10,
	left: 20,
	right: 20,
	height: 30,
	font: {
		fontSize: 20
	},
	text: 'Set/Get result:'
});

$.win.add(selectC);
$.win.add(set_get_result);

var values = [2,'g'];
selectC.setColumnsValues(values);
var current_values = selectC.getValue();

if (_.isEqual(values, current_values)) {
	set_get_result.applyProperties({
		color: '#0f0',
		text: 'Set/Get result: OK'
	});
} else {
	set_get_result.applyProperties({
		color: '#f00',
		text: 'Set/Get result: FAIL'
	});
}

// Set invalid value
var selectD = require('T/uifactory').createSelect({
	left: 20,
	hintText: 'Set Invalid Test',
	right: 20,
	top: 20,
	color: '#000',
	borderColor: '#888',
	backgroundColor: '#eee',
	columns: [
		[{title: 'uno', value: 1},2,{title:'three',value:3},4],
		[
		{title:'alpha',value:'a'},
		'b',
		'c',
		{title:'gamma',value:'g'}
		]
	],
});

var set_invalid_result = $.UI.create('Label', {
	top: 10,
	left: 20,
	right: 20,
	height: 30,
	font: {
		fontSize: 20
	},
	text: 'Set Invalid result:'
});

$.win.add(selectD);
$.win.add(set_invalid_result);

var invalid_values = [2,'z'];
var expected_values = [2, null];
selectD.setColumnsValues(invalid_values);
var current_invalid_values = selectD.getValue();

if (_.isEqual(expected_values, current_invalid_values)) {
	set_invalid_result.applyProperties({
		color: '#0f0',
		text: 'Set Invalid result: OK'
	});
} else {
	set_invalid_result.applyProperties({
		color: '#f00',
		text: 'Set Invalid result: FAIL'
	});
}
