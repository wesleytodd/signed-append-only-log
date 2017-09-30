'use strict';
const Log = require('./log');
const MemoryStore = require('./lib/stores/memory');
const Ed25519Sig = require('./lib/signatories/ed25519');
const errors = require('./lib/errors');
const {EntryContent, Entry} = require('./lib/entry');

module.exports = {
	createEntry: function createEntry (payload, prev, signatory, cb) {
		var ec = new EntryContent(payload, prev, signatory.publicKey);
		signatory.sign(ec.toBuffer(), function (err, signature) {
			if (err) {
				return cb(err);
			}
			cb(null, new Entry(ec, signature, signatory.type));
		});
	},
	createLog: function createLog ({store, signatories}, cb) {
		// Defaults
		signatories = signatories || [Ed25519Sig];
		store = store || new MemoryStore();
		var log = Log({
			store: store,
			signatories: signatories
		});
		return (typeof cb === 'function') ? process.nextTick(cb, null, log) : log;
	},

	E_NO_SIGNATORY: errors.E_NO_SIGNATORY,
	E_NO_PUB_KEY: errors.E_NO_PUB_KEY,
	E_NO_PRV_KEY: errors.E_NO_PRV_KEY,
	E_WRONG_HEAD: errors.E_WRONG_HEAD,
	E_PREV_HASH: errors.E_PREV_HASH,
	E_INVALID_HASH: errors.E_INVALID_HASH,
	E_INVALID_SIG: errors.E_INVALID_SIG,
	E_MISSING_ENTRY: errors.E_MISSING_ENTRY
};
