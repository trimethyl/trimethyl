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

var RRT = {
	map: {
		freq: {
			RR_to_IOS: {},
			IOS_to_RR: {}
		},
		weekday: {
			RR_to_IOS: {},
			IOS_to_RR: {}
		},
	},
	props: {
		RR_to_IOS: {},
		IOS_to_RR: {}
	}
};

exports.RRT = RRT;

RRT.map.freq.RR_to_IOS[ JSON.stringify(RRule.YEARLY) ] = Ti.Calendar.RECURRENCEFREQUENCY_YEARLY;
RRT.map.freq.RR_to_IOS[ JSON.stringify(RRule.MONTHLY) ] = Ti.Calendar.RECURRENCEFREQUENCY_MONTHLY;
RRT.map.freq.RR_to_IOS[ JSON.stringify(RRule.WEEKLY) ] = Ti.Calendar.RECURRENCEFREQUENCY_WEEKLY;
RRT.map.freq.RR_to_IOS[ JSON.stringify(RRule.DAILY) ] = Ti.Calendar.RECURRENCEFREQUENCY_DAILY;

RRT.map.weekday.RR_to_IOS[ JSON.stringify(RRule.MO) ] = 2;
RRT.map.weekday.RR_to_IOS[ JSON.stringify(RRule.TU) ] = 3;
RRT.map.weekday.RR_to_IOS[ JSON.stringify(RRule.WE) ] = 4;
RRT.map.weekday.RR_to_IOS[ JSON.stringify(RRule.TH) ] = 5;
RRT.map.weekday.RR_to_IOS[ JSON.stringify(RRule.FR) ] = 6;
RRT.map.weekday.RR_to_IOS[ JSON.stringify(RRule.SA) ] = 7;
RRT.map.weekday.RR_to_IOS[ JSON.stringify(RRule.SU) ] = 1;

RRT.map.freq.IOS_to_RR[ JSON.stringify(Ti.Calendar.RECURRENCEFREQUENCY_YEARLY) ] = RRule.YEARLY;
RRT.map.freq.IOS_to_RR[ JSON.stringify(Ti.Calendar.RECURRENCEFREQUENCY_MONTHLY) ] = RRule.MONTHLY;
RRT.map.freq.IOS_to_RR[ JSON.stringify(Ti.Calendar.RECURRENCEFREQUENCY_WEEKLY) ] = RRule.WEEKLY;
RRT.map.freq.IOS_to_RR[ JSON.stringify(Ti.Calendar.RECURRENCEFREQUENCY_DAILY) ] = RRule.DAILY;

RRT.map.weekday.IOS_to_RR[ 2 ] = RRule.MO;
RRT.map.weekday.IOS_to_RR[ 3 ] = RRule.TU;
RRT.map.weekday.IOS_to_RR[ 4 ] = RRule.WE;
RRT.map.weekday.IOS_to_RR[ 5 ] = RRule.TH;
RRT.map.weekday.IOS_to_RR[ 6 ] = RRule.FR;
RRT.map.weekday.IOS_to_RR[ 7 ] = RRule.SA;
RRT.map.weekday.IOS_to_RR[ 1 ] = RRule.SU;

RRT.props.RR_to_IOS = {
	interval : 'interval',
	count: function(ios, value) { 
		ios.end = { occurrenceCount: value }; 
	},
	until: function(ios, value) { 
		ios.end = { endDate: value }; 
	},
	freq : function(ios, value) { 
		ios.frequency = RRT.map.freq.RR_to_IOS[ JSON.stringify(value) ]; 
	},
	bymonth: 'monthsOfTheYear',
	bymonthday: 'daysOfTheMonth',
	byyearday: 'daysOfTheYear',
	byweekday: function(ios, value) {
		ios.daysOfTheWeek = value.map(function(day) {
			return { dayOfWeek: RRT.map.weekday.RR_to_IOS[ JSON.stringify(day) ] };
		});
	}
};

RRT.props.IOS_to_RR = {
	interval : 'interval',
	end: function(rruleOpt, value) {
		if (value.occurrenceCount) {
			rruleOpt.count = value.occurrenceCount;
		} else if (value.endDate) {
			rruleOpt.until = value.occurrenceCount;
		}
	},
	frequency: function(rruleOpt, value) { 
		rruleOpt.freq = RRT.map.freq.IOS_to_RR[ JSON.stringify(value) ]; 
	},
	monthsOfTheYear: 'bymonth',
	daysOfTheMonth: 'bymonthday',
	daysOfTheYear: 'byyearday',
	daysOfTheWeek: function(rruleOpt, value) {
		rruleOpt.byweekday = value.map(function(wkDayObj) {
			return RRT.map.weekday.IOS_to_RR[ JSON.stringify(wkDayObj.dayOfWeek) ];
		});
	}
};

RRT.RRuleOptToiOSRecurrenceRule = function(rruleOpt) {
	var ios = {};
	_.each(RRT.props.RR_to_IOS, function(ios_prop_key, rrule_prop_key) {
		var rrule_prop_val = rruleOpt[ rrule_prop_key ];
		if (rrule_prop_val == null) return;
		if (_.isArray(rrule_prop_val) && rrule_prop_val.length === 0) return;

		if (_.isString(ios_prop_key)) {
			ios[ ios_prop_key ] = rrule_prop_val;
		} else if (_.isFunction(ios_prop_key)) {
			ios_prop_key(ios, rrule_prop_val);
		}
	});
	return ios;
};

RRT.iOSRecurrenceRuleToRRuleOpt = function(ios) {
	var rruleOpt = {};
	_.each(RRT.props.IOS_to_RR, function(rrule_prop_key, ios_prop_key) {
		var ios_prop_val = ios[ ios_prop_key ];
		if (ios_prop_val == null) return;

		if (_.isString(rrule_prop_key)) {
			rruleOpt[ rrule_prop_key ] = ios_prop_val;
		} else if (_.isFunction(rrule_prop_key)) {
			rrule_prop_key(rruleOpt, ios_prop_val);
		}
	});
	return rruleOpt;
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

	if (_.isString(opt.begin)) opt.begin = Moment(opt.begin).getDate();
	if (_.isString(opt.end)) opt.end = Moment(opt.end).getDate();
	
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
	var cal = calendar.getEventById(id);

	return cal;
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

 	if (OS_IOS) {

 		var iosRRule = RRT.RRuleOptToiOSRecurrenceRule(rruleOpt);
 		event.recurrenceRules = [ event.createRecurrenceRule(iosRRule) ];
		event.save( Ti.Calendar.SPAN_FUTUREEVENTS );

	} else if (OS_ANDROID) {

		var rows = LDACalendar.updateEventRecurrenceRule(event.id, RRule.toString(rruleOpt));
		if (rows != 1) {
			throw new Error("Error while saving recurrence rules");
		}

	}

	return event;
};

exports.getRecurrenceRule = function(event) {
	var rrule = null;

	if (OS_IOS) {
		if (event.recurrenceRules != null) {
			var rruleOpt = RRT.iOSRecurrenceRuleToRRuleOpt(event.recurrenceRules[0]);
			rruleOpt.dtstart = Moment(event.begin).toDate();
			rrule = new RRule(rruleOpt);
		}
	} else if (OS_ANDROID) {
		if (event.rrule != null) {
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
	if (_.isString(d1)) d1 = Moment(d1).getDate();
	if (_.isString(d2)) d2 = Moment(d2).getDate();

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
