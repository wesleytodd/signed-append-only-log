'use strict';
const assert = require('assert');
const {createEntry} = require('../../');
const {hashEntry} = require('../../lib/entry');

module.exports = function createEntries (items, sig, cb) {
	var entries = [];
	var head = null;
	function create (i) {
		if (i === items.length) {
			return cb(entries);
		}

		createEntry(Buffer.from(items[i]), head, sig, function (err, entry) {
			assert(!err, err);
			head = hashEntry(entry);
			entries.push(entry);
			create(++i);
		});
	}

	create(0);
};
