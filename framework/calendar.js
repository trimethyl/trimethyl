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

var RRule = require('T/ext/rrule');
exports.RRule = RRule;

if (OS_ANDROID) {
	var LDACalendar = require('lucadamico.android.calendar');
}

var iOSDateFormat = 'YYYY-MM-DDTHH:mm:ss.SSS+0000';

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

	if (_.isString(opt.begin)) opt.begin = Moment(opt.begin).toDate();
	if (_.isString(opt.end)) opt.end = Moment(opt.end).toDate();
	
	if (opt.end < opt.begin) throw new Error("Calendar: The end date is lesser than begin date");

	var event = calendar.createEvent( _.omit(opt, 'recurrenceRule', 'alerts') );

	if (opt.recurrenceRule != null) {
		exports.setRecurrenceRule(event, opt.recurrenceRule);
	}

	if (opt.alerts != null) {
		exports.setAlerts(event, opt.alerts);
	}

	if (OS_IOS) {
		event.save( Ti.Calendar.SPAN_FUTUREEVENTS );
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
	return calendar.getEventById(id);
};

/**
 * Set a recurrence rule for the event.
 * Multiple recurrences are not supported for platform parity.
 * @param {Ti.Calendar.Event} event  The event.
 * @param {Object} rule  An object with recurrence rule.
 */
exports.setRecurrenceRule = function(event, rruleOpt) {
	rruleOpt.interval = rruleOpt.interval || 1;
	rruleOpt.dtstart = Moment(event.begin).toDate();
	var rrule = new RRule(rruleOpt);

 	if (OS_IOS) {

 		event.recurrenceRules = [ event.createRecurrenceRuleFromString(rrule.toString()) ];
		event.save( Ti.Calendar.SPAN_FUTUREEVENTS );

	} else if (OS_ANDROID) {

		var rows = LDACalendar.updateEventRecurrenceRule(event.id, rrule.toString());
		if (rows != 1) {
			throw new Error("Error while saving recurrence rules");
		}

	}

	return event;
};

/**
 * Get a recurrence rule instance for an event
 * @param  {Ti.Calendar.Event}
 * @return {calendar.RRule}
 */
exports.getRecurrenceRule = function(event) {
	var rrule = null;

	if (OS_IOS) {
		if (!_.isEmpty(event.recurrenceRules)) {
			rrule = new RRule(_.extend(rruleOpt, {
				dtstart: Moment(event.begin).toDate()
			}));
		}
	} else if (OS_ANDROID) {
		if (!_.isEmpty(event.rrule)) {
			rrule = RRule.fromString(event.rrule);
		}
	}

	return rrule;
};

/**
 * Set the alerts for the event.
 * Each alert specifies how many minutes in advance the user will receive the notification (must be positive)
 * @param  {Ti.Calendar.Event} event
 * @param  {Array} alerts
 * @return {Ti.Calendar.Event}
 */
exports.setAlerts = function(event, alerts) {
	if (OS_IOS) {
		event.alerts = _.map(alerts, function(minutes) {
			return event.createAlert({
				relativeOffset: -1 * (minutes * 60 * 1000)
			});
		});
		event.save( Ti.Calendar.SPAN_FUTUREEVENTS );
	} else if (OS_ANDROID) {
		LDACalendar.deleteAllEventReminders(event.id);
		_.each(alerts, function(minutes) {
			var status = (1 == LDACalendar.addReminderToEvent(event.id, minutes));
			if (!status) throw new Error("Calendar: error in update event recurrence rule");
		});
	}
	
	return event;
};

/**
 * Get the alerts for the event.
 * @param  {Ti.Calendar.Event} event
 * @return {Array} alerts
 */
exports.getAlerts = function(event) {
	var alerts = [];

	if (OS_IOS) {
		alerts = event.getAlerts().map(function(a) {
			return -1 * (a.relativeOffset / (60 * 1000));
		});
	} else if (OS_ANDROID) {
		alerts = event.getAlerts().map(function(a) {
			return a.minutes;
		});
	}
	
	return alerts;
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
		try {
			var rows = LDACalendar.deleteEvent(event.id);
			return (rows == 1);
		} catch (ex) {
			return false;
		}
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
	d1 = Moment(d1).format(iOSDateFormat);
	d2 = Moment(d2).format(iOSDateFormat);
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
	var id = Ti.App.Properties.getString('calendar_id', null);
	var cal = id != null ? exports.getCalendarById(id) : null;

	if (cal != null) return cal;

	id = exports.createCalendar({ name: Ti.App.name });
	if (id != null) {
		cal = exports.getCalendarById(id);
		Ti.App.Properties.setString('calendar_id', id);
	}

	if (cal != null) return cal;

	var defaultCalendar = exports.getDefaultCalendar();
	Ti.App.Properties.setString('calendar_id', defaultCalendar.id);
	return defaultCalendar;
};

/**
 * Delete a calendar by its ID
 * @param  {String} id The ID
 * @return {Boolean}
 */
exports.deleteCalendarById = function(id) {
	return Ti.Calendar.deleteCalendarById(id);
};

/**
 * Delete a calendar
 * @param  {Ti.Calendar} Calendar object
 * @return {Boolean}
 */
exports.deleteCalendar = function(c) {
	return exports.deleteCalendarById(c.id);
};

/**
 * Request the permissions to use calendars functions.
 * @param  {Function} success
 * @param  {Function} error
 */
exports.requestPermissions = function(success, error) {
	return Permissions.requestCalendarPermissions(success, error);
};
