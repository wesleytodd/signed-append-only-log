'use strict';
const ed = require('ed25519-supercop');
const errors = require('../errors');

var Signatory = module.exports = function Ed25519Signatory (publicKey, privateKey) {
	this.type = Signatory.type;
	this.publicKey = publicKey;
	this.privateKey = privateKey;
};

Signatory.type = 'ed25519';

Signatory.prototype.sign = function (payload, cb) {
	if (!this.publicKey) {
		return handleError(errors.noPubKey(), cb);
	}
	if (!this.privateKey) {
		return handleError(errors.noPrvKey(), cb);
	}

	process.nextTick(cb, null, ed.sign(payload, this.publicKey, this.privateKey));
};

Signatory.prototype.verify = function (payload, sig, cb) {
	if (!this.publicKey) {
		return handleError(errors.noPubKey(), cb);
	}

	setTimeout(() => {
		process.nextTick(cb, null, ed.verify(sig, payload, this.publicKey));
	}, 10);
};

Signatory.generateKeypair = function (cb) {
	var sig = ed.createKeyPair(ed.createSeed());
	process.nextTick(cb, null, {
		publicKey: sig.publicKey,
		privateKey: sig.secretKey
	});
};

function handleError (err, cb) {
	if (typeof cb === 'function') {
		return process.nextTick(cb, err);
	} else {
		throw err;
	}
}
