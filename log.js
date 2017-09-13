'use strict';
const verify = require('./lib/verify');
const write = require('./lib/write');
const errors = require('./lib/errors');

module.exports = function createLog ({store, signatories}) {
	// Turn signatories into an object by type
	var sig = (signatories || []).reduce(function (s, Signatory) {
		s[Signatory.type] = Signatory;
		return s;
	}, {});

	return {
		store: store,
		signatories: signatories,
		head: function (cb) {
			return store.head(cb);
		},

		write: function (entry, cb) {
			if (!sig[entry.signatureType]) {
				return cb(errors.noSignatory(entry.signatureType));
			}

			return write(store, new sig[entry.signatureType](entry.content.key), entry, cb);
		},

		get: function (hash, cb) {
			return store.get(hash, cb);
		},

		createReadStream: function (opts) {
			return store.createReadStream(opts);
		},

		verify: function (cb) {
			return verify(store, sig, cb);
		}
	};
};
