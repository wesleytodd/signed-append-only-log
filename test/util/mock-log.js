'use strict';
const assert = require('assert');
const saol = require('../../');

// Creates a log with the specified items, but in reverse
module.exports = function mockLog (items, opts, done) {
	if (typeof opts === 'function') {
		done = opts;
		opts = {};
	}

	var log = saol(opts);
	write(items.length - 1, function () {
		done(log);
	});

	function write (i, cb) {
		if (i < 0) {
			return cb();
		}

		log.write(items[i], function (err, hash, entry) {
			assert(!err);
			write(--i, cb);
		});
	}
};
