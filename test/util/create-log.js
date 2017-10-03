'use strict';
const assert = require('assert');
const {createLog} = require('../../');
const createEntries = require('./create-entries');

// Creates a log with the specified items, but in reverse
module.exports = function (items, sig, cb) {
	createEntries(items, sig, function (entries) {
		var log = createLog();
		write(0);
		function write (i) {
			if (i === items.length) {
				return cb(log, entries);
			}
			log.write(entries[i], function (err) {
				assert(!err);
				write(++i);
			});
		}
	});
};
