'use strict';
const Entry = require('./entry');
const hashEntry = require('./hash-entry');

module.exports = function push (buf, store, signatory, cb) {
	store.sequence(function (err, seq = 0) {
		if (err) {
			return cb(err);
		}
		store.tail(function (err, tail = null) {
			if (err) {
				return cb(err);
			}

			// Sign the buffer
			var signature = signatory.sign(buf);

			// Create an entry for this buffer
			var entry = new Entry(buf, seq + 1, signature, tail);

			// Create hash of the entry
			var hash = hashEntry(entry);

			// Put the entry in the store
			store.put(hash, entry, function (err) {
				if (err) {
					return cb(err);
				}

				cb(null, hash, entry);
			});
		});
	});
};
