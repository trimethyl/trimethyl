/**
 * @module  calendar
 * @author  Flavio De Stefano <flavio.destefano@caffeina.com>
 */

/**
 * @property config
 */
exports.config = _.extend({
}, Alloy.CFG.T ? Alloy.CFG.T.calendar : {});

var Util = require('T/util');
var Moment = require('alloy/moment');
var Permissions = require('T/permissions');

if (OS_ANDROID) {
	var LDACalendar = require('lucadamico.android.calendar');
}

var BYDAY = {
	'SU' : 1,
	'MO' : 2,
	'TU' : 3,
	'WE' : 4,
	'TH' : 5,
	'FR' : 6,
	'SA' : 7
};

/*
http://www.kanzaki.com/docs/ical/recur.html
http://docs.oracle.com/cd/B25221_04/web.1013/b15876/rfc-2445.htm
*/

var RRules = {

	build: function(startDate, r) {
		var startDateStr = Moment(startDate).format('YYYYMMDDTHHmmss');

		var freq = r.frequency.toUpperCase();

		var parts = [];
		parts.push("FREQ=" + freq); 
		//	parts.push("DTSTART=" + startDateStr);

		// The recurrence end can be specified by a date (date-based) or by a maximum count of occurrences (count-based)
		// ; either UNTIL or COUNT may appear in a 'recur',
      // ; but UNTIL and COUNT MUST NOT occur in the same 'recur'
		if (r.end != null) {
			if (r.end.endDate != null) {
				parts.push("UNTIL=" + Moment(r.end.endDate).format('YYYYMMDDTHHmmss'));
			} else if (r.end.occurrenceCount != null) {
				parts.push("COUNT=" + Number(r.end.occurrenceCount));
			} else {
				throw new Error("The end property must specify endDate or occurrenceCount");
			}
		}

		if (r.interval != null) {
			parts.push("INTERVAL=" + Number(r.interval));
		}

		// The days of the month that the event occurs, as an array of number objects. 
		// Values can be from 1 to 31 and from -1 to -31. 
		if (r.daysOfTheMonth != null) {
			if (freq != 'MONTHLY') throw new Error("daysOfTheMonth rule is only valid with MONTHLY frequency");
			parts.push("BYMONTHDAY=" + r.daysOfTheMonth.join(','));
		}

		// The days of the year that the event occurs, as an array of number objects. 
		// Values can be from 1 to 366 and from -1 to -366.
		else if (r.daysOfTheYear != null) {
			if (freq != 'YEARLY') throw new Error("daysOfTheYear rule is only valid with YEARLY frequency");
			parts.push("BYYEARDAY=" + r.daysOfTheYear.join(','));
		}

		// The months of the year that the event occurs, as an array of Number objects. 
		// Values can be from 1 to 12. 
		else if (r.monthsOfTheYear != null) {
			if (freq != 'YEARLY') throw new Error("monthsOfTheYear rule is only valid with YEARLY frequency");
			parts.push("BYMONTH=" + r.monthsOfTheYear.join(','));
		}

		// The weeks of the year that the event occurs, as an array of number objects. 
		// Values can be from 1 to 53 and from -1 to -53. 
		else if (r.weeksOfTheYear != null) {
			if (freq != 'YEARLY') throw new Error("weeksOfTheYear rule is only valid with YEARLY frequency");
			parts.push("BYWEEKNO=" + r.weeksOfTheYear.join(','));
		}

		// The day of the week. 
		// Values are from 1 to 7, with Sunday being 1.
		else if (r.daysOfTheWeek != null) {
			parts.push("BYDAY=" + r.daysOfTheWeek.join(','));
		}

		return parts.join(';');
	}

};

/**
 * Create an event in calendar
 * @param {Ti.Calendar.Calendar} calendar The calendar object
 * @param {Object} opt  Event properties. All properties are inherithed by Titanium.Calendar.Event
 * @param {Object} [opt.recurrenceRule] An optional recurrence rule.
 * @param {Object} [opt.alerts] An array of alerts.
 * @return {String} Event ID
 */
exports.createEvent = function(calendar, opt) {
	if (calendar == null) throw new Error("Calendar: passed calendar is null");
	if (calendar.id == null) throw new Error("Calendar: passed calendar doesn't have an ID");

	if (opt.title == null) throw new Error("Calendar: Set a title");
	if (opt.begin == null) throw new Error("Calendar: Set a begin date");
	if (opt.end == null && opt.allDay != true) throw new Error("Calendar: Set an end date or an allDay event");

	if (_.isString(opt.begin)) opt.begin = new Date(opt.begin);
	if (_.isString(opt.end)) opt.end = new Date(opt.end);
	
	if (opt.end < opt.begin) throw new Error("Calendar: The end date is lesser than begin date");

	var event = calendar.createEvent( _.omit(opt, 'recurrenceRule', 'alerts') );

	if (opt.recurrenceRule != null) {
		exports.setRecurrenceRule(event, opt.recurrenceRule);
	}

	if (opt.alerts != null) {
		exports.setAlerts(event, opt.alerts);
	}

	return event.id;
};

/**
 * Retrieve an event by its ID
 * @param  {Ti.Calendar.Calendar} calendar The calendar object
 * @param  {String} id	The ID
 * @return {Ti.Calendar.Event}
 */
exports.getEventById = function(calendar, id) {
	var cal = calendar.getEventById(id);

	return cal;
};

/**
 * Set a recurrence rule for the event.
 * Multiple recurrences are not supported for platform parity.
 * @param {Ti.Calendar.Event} event  The event.
 * @param {Object} rule  An object with recurrence rule.
 */
exports.setRecurrenceRule = function(event, rule) {
	rule.interval = rule.interval || 1;

 	if (OS_IOS) {

 		// Convert the special rule daysOfTheWeek to the iOS equivalent
 		if (rule.daysOfTheWeek != null) {
 			rule.daysOfTheWeek = rule.daysOfTheWeek.map(function(e) {
 				return { 
 					week: 0,
 					dayOfWeek: BYDAY[e]
 				};
 			});
 		}

		rule.frequency = Ti.Calendar['RECURRENCEFREQUENCY_' + rule.frequency.toUpperCase()];
		event.recurrenceRules = [ rule ].map(event.createRecurrenceRule);
		event.save( Ti.Calendar.SPAN_FUTUREEVENTS );

	} else if (OS_ANDROID) {

		var rrule = RRules.build(event.begin, rule);
		var status = (1 == LDACalendar.updateEventRecurrenceRule(event.id, rrule));
		if (!status) {
			throw new Error("Calendar: errore in update event recurrence rule");
		}

	}

	return event;
};

exports.getRecurrenceRule = function(event) {
	var rule = null;

	if (OS_IOS) {

		if (event.recurrenceRules != null) {
			rule = event.recurrenceRules[0];
			switch (rule.frequency) {
				case Ti.Calendar.RECURRENCEFREQUENCY_DAILY: 
			}
		}

	} else if (OS_ANDROID) {

	}

	return rule;
};

/**
 * Set the alerts for the event.
 * Each alert specifies how many minutes in advance the user will receive the notification (must be positive)
 * @param  {Ti.Calendar.Event} event
 * @param  {Array} alerts
 */
exports.setAlerts = function(event, alerts) {
	if (OS_IOS) {

		event.alerts = _.map(alerts, function(minutes) {
			return event.createAlert({
				relativeOffset: - (minutes * 60 * 1000)
			});
		});

		event.save( Ti.Calendar.SPAN_FUTUREEVENTS );

	} else {
		
		LDACalendar.deleteAllEventReminders(event.id);
		_.each(alerts, function(minutes) {
			var status = (1 == LDACalendar.addReminderToEvent(event.id, minutes));
			if (!status) throw new Error("Calendar: errore in update event recurrence rule");
		});

	}
	
	return event;
};

/**
 * Delete an event by its ID.
 * @param  {Ti.Calendar.Event} event The event.
 * @return {Boolean}
 */
exports.deleteEvent = function(event) {
	if (OS_IOS) {

		try {
			event.remove( Ti.Calendar.SPAN_FUTUREEVENTS );
			return true;
		} catch (ex) {
			Ti.API.error("Calendar: failed deleting event", ex.message);
			return false;
		}

	} else if (OS_ANDROID) {

		var status = (1 == LDACalendar.deleteEvent(event.id));
		if (!status) Ti.API.error("Calendar: failed deleting event");
		return status;
	}
};

/**
 * Create a calendar.
 * @param  {Object} opt
 * @return {String} The calendar ID.
 */
exports.createCalendar = function(opt) {
	return Ti.Calendar.createCalendar(opt);
};

/**
 * Get a calendar by its ID.
 * @param  {String} id
 * @return {Ti.Calendar.Calendar}
 */
exports.getCalendarById = function(id) {
	return Ti.Calendar.getCalendarById(id);
};

/**
 * Get the default calendar for adding new events.
 * @return {Ti.Calendar.Calendar}
 */
exports.getDefaultCalendar = function() {
	// TODO: Create if zero calendar founds
	return Ti.Calendar.defaultCalendar || Ti.Calendar.allCalendars[0];
};

/**
 * Retrieve all calendars.
 * @return {Ti.Calendar.Calendar[]}
 */
exports.getAllCalendars = function() {
	return Ti.Calendar.allCalendars;
};

/**
 * Get the events of a calendar between two dates.
 * @param  {Ti.Calendar.Calendar}  cal
 * @param  {Object} d1  The date from
 * @param  {Object} d2  The date to
 * @return {Ti.Calendar.Event[]}
 */
exports.getEventsBetweenDates = function(cal, d1, d2) {
	if (_.isString(d1)) d1 = new Date(d1);
	if (_.isString(d2)) d2 = new Date(d2);

	return cal.getEventsBetweenDates(d1, d2);
};

/**
 * Get the events of a calendar in a specified date.
 * @param  {Ti.Calendar.Calendar} cal
 * @param  {Number} year
 * @param  {Number} month
 * @param  {Number} day
 * @return {Ti.Calendar.Event[]}
 */
exports.getEventsInDate = function(cal, year, month, day) {
	return cal.getEventsInDate(year, month, day);
};

/**
 * Get the events of a calendar in a month.
 * @param  {Number} cal
 * @param  {Number} year
 * @param  {Number} month
 * @return {Ti.Calendar.Event[]}
 */
exports.getEventsInMonth = function(cal, year, month) {
	return cal.getEventsInMonth(year, month);
};

/**
 * Get the events of a calendar in a year.
 * @param  {Number} cal
 * @param  {Number} year
 * @return {Ti.Calendar.Event[]}
 */
exports.getEventsInYear = function(cal, year) {
	return cal.getEventsInYear(year);
};

/**
 * Get or create a Calendar that can be used by the application without dirtying other calendars.
 * The calendar ID object is saved in a persistent storage that will be deleted when the app
 * will be uninstalled, so take care of your ID.
 * The calendar name is automatically set by application name.
 * @return {Ti.Calendar.Calendar}
 */
exports.getOrCreateAppCalendar = function() {
	var id = null;
	var cal = null;
	var defaultCalendar = exports.getDefaultCalendar();

	if ( ! Ti.App.Properties.hasProperty('calendar_id')) {

		id = exports.createCalendar({ name: Ti.App.name });
		if (id != null) cal = exports.getCalendarById(id);

		if (id != null && cal != null) {
			Ti.App.Properties.setString('calendar_id', id);
		} else {
			Ti.App.Properties.setString('calendar_id', defaultCalendar.id);
			cal = defaultCalendar;
		}

	} else {
		id = Ti.App.Properties.getString('calendar_id');
		cal = exports.getCalendarById(id);
	}

	return cal || exports.getDefaultCalendar();
};

/**
 * Request the permissions to use calendars functions.
 * @param  {Function} success
 * @param  {Function} error
 */
exports.requestPermissions = function(success, error) {
	return Permissions.requestCalendarPermissions(success, error);
};