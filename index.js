'use strict';
const Store = require('./lib/memory-store');
const Signatory = require('./lib/signatory');
const push = require('./lib/push');
const verify = require('./lib/verify');

module.exports = function createAppendOnlyLog (opts = {}) {
	// Create the store
	var store = opts.store || new Store();

	// Create signatory
	var signatory = opts.signatory || new Signatory();

	return {
		sequence: function (cb) {
			store.sequence(cb);
		},

		write: function (content, cb) {
			// Ensure its a buffer
			var buf = (!Buffer.isBuffer(content)) ? Buffer.from(content) : content;

			// Write it to the log
			push(buf, store, signatory, cb);
		},

		get: function (hash, cb) {
			return store.get(hash, cb);
		},

		createReadStream: function (opts) {
			return store.createReadStream(opts);
		},

		verify: function (cb) {
			return verify(store, signatory, cb);
		},

		E_TIMESTAMP_ORDER: verify.E_TIMESTAMP_ORDER,
		E_PREV_HASH: verify.E_PREV_HASH,
		E_INVALID_HASH: verify.E_INVALID_HASH,
		E_INVALID_SIG: verify.E_INVALID_SIG
	};
};
