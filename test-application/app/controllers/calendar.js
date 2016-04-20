var Calendar = T('calendar');
var Moment = require('alloy/moment');

Calendar.addEvent({
	title: 'Trimethyl Test Event',
	begin: Moment().startOf('day').toDate(),
	end: Moment().endOf('day').toDate(),
	description: 'Example description for Android',
	notes: 'Example notes for iOS'
}, 
function() {
	alert('Create event OK');
}, 
function() {
	alert('Error');
});
