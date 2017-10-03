'use strict';
const assert = require('assert');
const Ed25519Sig = require('../../lib/signatories/ed25519');

module.exports = function (cb) {
	// Generate a keypair for the signatory to write with
	Ed25519Sig.generateKeypair(function (err, keypair) {
		assert(!err);

		// Create signatory to sign with
		cb(new Ed25519Sig(keypair.publicKey, keypair.privateKey));
	});
};
