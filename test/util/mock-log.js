'use strict';
const assert = require('assert');
const {createLog, createEntry} = require('../../');
const MemoryStore = require('../../lib/stores/memory');
const Ed25519Sig = require('../../lib/signatories/ed25519');

// Creates a log with the specified items, but in reverse
module.exports = function mockLog (items, opts, done) {
	if (typeof opts === 'function') {
		done = opts;
		opts = {};
	}

	var log = createLog(opts.store || new MemoryStore(), [Ed25519Sig]);

	// Generate a keypair for the signatory to write with
	Ed25519Sig.generateKeypair(function (err, keypair) {
		assert(!err);

		// Create signatory to sign with
		var sig = new Ed25519Sig(keypair.publicKey, keypair.privateKey);

		write(items.length - 1, sig, function () {
			done(log, sig);
		});
	});

	function write (i, sig, cb) {
		if (i < 0) {
			return cb();
		}

		log.head(function (err, head) {
			assert(!err);

			createEntry(Buffer.from(items[i]), head, sig, function (err, entry) {
				assert(!err, err);

				log.write(entry, function (err) {
					assert(!err);
					write(--i, sig, cb);
				});
			});
		});
	}
};
