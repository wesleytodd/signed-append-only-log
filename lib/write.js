'use strict';
const {hashEntry} = require('./entry');
const errors = require('./errors');

module.exports = function write (store, signatory, entry, cb) {
	store.head(function (err, head) {
		if (err) {
			return cb(err);
		}

		// Check head
		if (entry.content.prev !== head) {
			return cb(errors.eWrongHead(entry.content.prev, head));
		}

		// Create hash of the entry
		var hash = hashEntry(entry);

		signatory.verify(entry.content.toBuffer(), entry.signature, function (err, verified) {
			if (err) {
				return cb(err);
			}

			if (!verified) {
				return cb(errors.invalidSignature(hash, entry.signature, entry.signatureType));
			}

			// Put the entry in the store
			store.put(hash, entry, function writeHandler (err) {
				if (err) {
					return cb(err);
				}

				cb(null, hash);
			});
		});
	});
};
