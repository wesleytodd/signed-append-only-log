'use strict';
// const errors = require('../errors');
const parallel = require('run-parallel');
const level = require('level');
const {fromJSON} = require('../entry');

// Key prefixes
const DELIM = ':';
const ENTRY = 'ENTRY' + DELIM;
const ENTRY_CHAIN = 'ENTRY_CHAIN' + DELIM;
const PREV = 'PREV' + DELIM;
const NEXT = 'NEXT' + DELIM;
const HEAD = 'HEAD' + DELIM;
function keyify (prefix, val) {
	return prefix + val.toString('hex');
}
function valify (val) {
	return val.toString('hex');
}

var LevelStore = module.exports = function LevelStore (opts = {}, cb) {
	if (typeof opts === 'function') {
		cb = opts;
		opts = {};
	}
	if (!(this instanceof LevelStore)) {
		return new LevelStore(opts, cb);
	}
	this.db = level(opts.location, (err, db) => {
		this.db = db;
		cb(err, this);
	});
};

LevelStore.prototype.put = function (hash, entry, cb) {
	// If no previous, this is intended to be a new log chain
	if (!entry.content.prev) {
		putEntry(this.db, hash, hash, entry, cb);
	} else {
		// Get the tail for this entry
		this.db.get(keyify(ENTRY_CHAIN, entry.content.prev), (err, chain) => {
			if (err) {
				return cb(err);
			}

			// Chain will be a hex encoded string
			if (typeof chain === 'string') {
				chain = Buffer.from(chain, 'hex');
			}

			// If we didn't find an entry for that chain, something might be corrupt.  So revisit
			// this once I have some things using it, for now just treat it as a new chain
			putEntry(this.db, chain || hash, hash, entry, cb);
		});
	}
};

LevelStore.prototype.get = function (hash, cb) {
	parallel([
		getEntry.bind(this, hash),
		getPrev.bind(this, hash),
		getNext.bind(this, hash)
	], function (err, [entry, prev, next]) {
		cb(err, entry, prev, next);
	});
};

LevelStore.prototype.head = function (chain, cb) {

};

LevelStore.prototype.createReadStream = function (opts = {}) {

};

LevelStore.prototype.createKeyStream = function () {

};

LevelStore.prototype.createValueStream = function () {

};

LevelStore.prototype.close = function (cb) {
	this.db.close(cb);
};

function putEntry (db, chain, hash, entry, cb) {
	var batch = db.batch();

	// The entry by hash
	batch.put(keyify(ENTRY, hash), entry, {
		valueEncoding: 'json'
	});

	// The entry to chain index
	batch.put(keyify(ENTRY_CHAIN, hash), valify(chain));

	// The head pointer
	batch.put(keyify(HEAD, chain), valify(hash));

	// This is a new chain there is a prev pointer
	if (entry.content.prev) {
		// This is not a new chain, do next and prev
		batch.put(keyify(PREV, hash), valify(entry.content.prev));
		batch.put(keyify(NEXT, entry.content.prev), valify(hash));
	}

	batch.write(cb);
}

function getEntry (hash, cb) {
	// Get the entry
	this.db.get(keyify(ENTRY, hash), (err, entryJson) => {
		if (err && err.type !== 'NotFoundError') {
			return cb(err);
		}
		// Not found converted to not be an error
		if (err) {
			return cb();
		}

		// Try to parse the json into an entry
		var entry;
		try {
			entry = fromJSON(JSON.parse(entryJson));
		} catch (e) {
			return cb(e);
		}

		cb(null, entry);
	});
}

function getPrev (hash, cb) {
	this.db.get(keyify(PREV, hash), function (err, prev) {
		if (err && err.type !== 'NotFoundError') {
			return cb(err);
		}
		cb(null, prev && Buffer.from(prev, 'hex'));
	});
}

function getNext (hash, cb) {
	this.db.get(keyify(NEXT, hash), function (err, next) {
		if (err && err.type !== 'NotFoundError') {
			return cb(err);
		}
		cb(null, next && Buffer.from(next, 'hex'));
	});
}
