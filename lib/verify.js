'use strict';
const hashEntry = require('./hash-entry');

module.exports = function verify (store, signatory, cb) {
	var err = null;
	var prevHash = null;
	var prevTimestamp = null;
	var done = function (errMsg) {
		if (!errMsg) {
			return;
		}
		err = new Error(errMsg);
		stream.destroy(err);
	};

	var stream = store.createReadStream({
		reverse: true
	});

	stream.on('data', function ({key: hash, value: entry}) {
		if (err) {
			return;
		}

		// Check timestamp
		if (prevTimestamp && entry.timestamp < prevTimestamp) {
			return done(eTimestampError(hash, prevTimestamp, entry.timestamp));
		}

		// Verify previous hash
		if (prevHash && !entry.prev.equals(prevHash)) {
			return done(ePrevHashError(hash, prevHash, entry.prev));
		}

		// Verify hash
		var rehash = hashEntry(entry);
		if (!rehash.equals(hash)) {
			return done(eInvalidHash(hash, rehash));
		}

		// check signature
		if (!signatory.verify(entry.data, entry.signature)) {
			return done(eInvalidSignature(hash, entry.signature));
		}

		prevTimestamp = entry.timestamp;
		prevHash = hash;
	});

	stream.on('error', function (e) {
		// If err is still null, then it was a storage error,
		// not a validity error, but either one means we
		// were unable to validate the log
		cb(e, err ? false : null);
	});

	stream.on('end', function () {
		!err && cb(null, true);
	});
};

function makeError (msg, code) {
	var e = new Error(msg);
	e.code = code;
	return e;
}

module.exports.E_TIMESTAMP_ORDER = 'E_TIMESTAMP_ORDER';
function eTimestampError (hash, t1, t2) {
	return makeError(
		'Invalid timestamp order for item ' + hash.toString('hex') + '. ' +
		'The previous entries timestamp was ' + t1 + ', which is ' +
		'after the current entries timestamp of ' + t2 + '. Entries ' +
		'must be ordered in ncreasing timestamp order.',
		module.exports.E_TIMESTAMP_ORDER
	);
}

module.exports.E_PREV_HASH = 'E_PREV_HASH';
function ePrevHashError (hash, prevHash, listedHash) {
	return makeError(
		'Hash does not match hash of previous entry for ' +
		hash.toString('hex') + '. Content hash was ' +
		prevHash.toString('hex') + ' but expected ' +
		listedHash.toString('hex') + '.',
		module.exports.E_PREV_HASH
	);
}

module.exports.E_INVALID_HASH = 'E_INVALID_HASH';
function eInvalidHash (hash, expected) {
	return makeError(
		'Invalid content hash for ' + hash.toString('hex') +
		' expected ' + expected.toString('hex'),
		module.exports.E_PREV_HASH
	);
}

module.exports.E_INVALID_SIG = 'E_INVALID_SIG';
function eInvalidSignature (hash, sig) {
	return makeError(
		'Invalid signature for ' + hash.toString('hex') +
		'.  Could not verify the signature ' + sig.toString('hex'),
		module.exports.E_PREV_HASH
	);
}
