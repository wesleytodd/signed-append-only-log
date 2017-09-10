'use strict';
const ed = require('ed25519-supercop');

var Signatory = module.exports = function Signatory (publicKey, secretKey) {
	var keypair;
	if (!publicKey) {
		keypair = ed.createKeyPair(ed.createSeed());
	}
	this.publicKey = publicKey || keypair.publicKey;
	this.privateKey = secretKey || keypair.secretKey;
};

Signatory.prototype.sign = function (data) {
	return ed.sign(data, this.publicKey, this.privateKey);
};

Signatory.prototype.verify = function (data, signature) {
	return ed.verify(signature, data, this.publicKey);
};
