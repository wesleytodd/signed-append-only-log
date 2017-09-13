'use strict';
const through = require('through2');
const pump = require('pump');
const {hashEntry} = require('./entry');
const errors = require('./errors');

module.exports = function verify (store, signatories, cb) {
	var prevHash = null;
	// Pipe the store stream into the verification stream
	return pump(store.createReadStream({
		reverse: true
	}), through.obj(function ({key: hash, value: entry}, enc, done) {
		// Verify previous hash
		if (prevHash && !entry.content.prev.equals(prevHash)) {
			return done(errors.prevHash(hash, prevHash, entry.content.prev));
		}

		// Verify hash
		var rehash = hashEntry(entry);
		if (!rehash.equals(hash)) {
			return done(errors.invalidHash(hash, rehash));
		}

		prevHash = rehash;

		// Check that we have that signatory type
		if (!signatories[entry.signatureType]) {
			return done(errors.noSignatory(entry.signatureType));
		}

		var signatory = new signatories[entry.signatureType](entry.content.key);

		// check signature
		signatory.verify(entry.content.toBuffer(), entry.signature, function (err, verified) {
			if (err) {
				return done(err);
			}
			if (!verified) {
				return done(errors.invalidSignature(hash, entry));
			}

			// Successfully processed, just move on
			done(null, {
				key: hash,
				value: entry
			});
		});
	}), function (err) {
		cb(err, !err);
	});
};
