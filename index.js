'use strict';
const Log = require('./log');
const MemoryStore = require('./lib/stores/memory');
const Ed25519Sig = require('./lib/signatories/ed25519');
const errors = require('./lib/errors');
const createEntry = require('./lib/entry');

module.exports = {
	createEntry: createEntry,
	createLog: function (store, signatories) {
		return Log({
			store: store || new MemoryStore(),
			signatories: signatories || [Ed25519Sig]
		});
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
