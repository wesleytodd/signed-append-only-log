'use strict';
function makeError (msg, code) {
	var e = new Error(msg);
	e.code = code;
	return e;
}

module.exports.E_NO_SIGNATORY = 'E_NO_SIGNATORY';
module.exports.noSignatory = function noSignatory (type) {
	return makeError(
		'No signatory for type ' + type,
		module.exports.E_NO_SIGNATORY
	);
};

module.exports.E_NO_PUB_KEY = 'E_NO_PUB_KEY';
module.exports.noPubKey = function noPubKey () {
	return makeError(
		'No public key in signatory',
		module.exports.E_NO_PUB_KEY
	);
};

module.exports.E_NO_PRV_KEY = 'E_NO_PRV_KEY';
module.exports.noPrvKey = function noPrvKey () {
	return makeError(
		'No private key in signatory',
		module.exports.E_NO_PRV_KEY
	);
};

module.exports.E_WRONG_HEAD = 'E_WRONG_HEAD';
module.exports.wrongHead = function wrongHead (prevHash, curHead) {
	return makeError(
		'Invalid head for entry. Current head is ' +
		curHead.toString('hex') + ' but got ' + prevHash.toString('hex'),
		module.exports.E_WRONG_HEAD
	);
};

module.exports.E_PREV_HASH = 'E_PREV_HASH';
module.exports.prevHash = function prevHash (hash, prevHash, listedHash) {
	return makeError(
		'Hash does not match hash of previous entry for ' +
		hash.toString('hex') + '. Content hash was ' +
		prevHash.toString('hex') + ' but expected ' +
		listedHash.toString('hex') + '.',
		module.exports.E_PREV_HASH
	);
};

module.exports.E_INVALID_HASH = 'E_INVALID_HASH';
module.exports.invalidHash = function invalidHash (hash, expected) {
	return makeError(
		'Invalid content hash for ' + hash.toString('hex') +
		' expected ' + expected.toString('hex'),
		module.exports.E_INVALID_HASH
	);
};

module.exports.E_INVALID_SIG = 'E_INVALID_SIG';
module.exports.invalidSignature = function invalidSignature (hash, entry) {
	return makeError(
		'Invalid signature.\n' +
		'   Entry:  ' + hash.toString('hex') + '\n' +
		'Sig Type:  ' + entry.signatureType + '\n' +
		'     Sig:  ' + entry.signature.toString('hex'),
		module.exports.E_INVALID_SIG
	);
};

module.exports.E_MISSING_ENTRY = 'E_MISSING_ENTRY';
module.exports.missingEntry = function missingEntry (hash) {
	return makeError(
		'Missing entry for hash ' + hash.toString('hex'),
		module.exports.E_MISSING_ENTRY
	);
};
