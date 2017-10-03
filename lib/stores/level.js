'use strict';
const parallel = require('run-parallel');
const levelup = require('levelup');
const errors = require('../errors');
const {fromJSON} = require('../entry');
const StoreReadStream = require('../store-stream');

// Lazy require level down
var leveldown;
function requireLeveldown () {
	leveldown = leveldown || require('leveldown');
	return leveldown;
}

// Key helpers
const ENTRY = 'ENTRY:';
const ENTRY_CHAIN = 'ENTRY_CHAIN:';
const PREV = 'PREV:';
const NEXT = 'NEXT:';
const HEAD = 'HEAD:';
function hexify (val) {
	return Buffer.isBuffer(val) ? val.toString('hex') : val;
}

// Level store constructor
var LevelStore = module.exports = function LevelStore (opts = {}, cb) {
	if (typeof opts === 'function') {
		cb = opts;
		opts = {};
	}
	if (!(this instanceof LevelStore)) {
		return new LevelStore(opts, cb);
	}
	levelup(opts.location || '.db', {
		db: opts.db || requireLeveldown()
	}, (err, db) => {
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
		this.db.get(ENTRY_CHAIN + hexify(entry.content.prev), (err, chain) => {
			if (err && err.type !== 'NotFoundError') {
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
		getEntry.bind(null, this.db, hash),
		getPrev.bind(null, this.db, hash),
		getNext.bind(null, this.db, hash)
	], (err, [entry, prev, next]) => {
		cb(err, entry, prev, next);
	});
};

LevelStore.prototype.head = function (hash, cb) {
	if (!hash) {
		return process.nextTick(cb, null, null);
	}

	getChain(this.db, hash, (err, chain) => {
		if (err) {
			return cb(err);
		}

		// Hash does not exist, new log
		if (!chain) {
			return cb(null, null);
		}

		this.db.get(HEAD + hexify(chain), (err, head) => {
			if (err && err.type !== 'NotFoundError') {
				return cb(err);
			}

			// Head entry missing for that chain
			// @TODO probably corrupt data, fix
			if (!head) {
				return cb(null, null);
			}

			cb(null, Buffer.from(head, 'hex'));
		});
	});
};

LevelStore.prototype.createReadStream = function (hash, opts = {}) {
	var s = new StoreReadStream(this, {
		highWaterMark: opts.highWaterMark,
		cursor: opts.from,
		limit: opts.limit,
		reverse: opts.reverse
	});

	// Pause until we load the starting hash
	if (!opts.from) {
		s.pause();
		if (opts.reverse) {
			getChain(this.db, hash, (err, chain) => {
				if (err || !chain) {
					return s.emit('error', errors.missingEntry(hash));
				}
				s.cursor = chain;
				s.resume();
			});
		} else {
			this.head(hash, (err, head) => {
				if (err || !head) {
					return s.emit('error', errors.missingEntry(hash));
				}
				s.cursor = head;
				s.resume();
			});
		}
	}

	return s;
};

LevelStore.prototype.close = function (cb) {
	this.db.close(cb);
};

//
// Helper methods
//
function putEntry (db, chain, hash, entry, cb) {
	var batch = db.batch();

	// The entry by hash
	batch.put(ENTRY + hexify(hash), entry, {
		valueEncoding: 'json'
	});

	// The entry to chain index
	batch.put(ENTRY_CHAIN + hexify(hash), hexify(chain));

	// The head pointer
	batch.put(HEAD + hexify(chain), hexify(hash));

	// This is a new chain there is a prev pointer
	if (entry.content.prev) {
		// This is not a new chain, do next and prev
		batch.put(PREV + hexify(hash), hexify(entry.content.prev));
		batch.put(NEXT + hexify(entry.content.prev), hexify(hash));
	}

	batch.write(cb);
}

function getEntry (db, hash, cb) {
	// Get the entry
	db.get(ENTRY + hexify(hash), (err, entryJson) => {
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

function getPrev (db, hash, cb) {
	db.get(PREV + hexify(hash), function (err, prev) {
		if (err && err.type !== 'NotFoundError') {
			return cb(err);
		}
		cb(null, prev && Buffer.from(prev, 'hex'));
	});
}

function getNext (db, hash, cb) {
	db.get(NEXT + hexify(hash), function (err, next) {
		if (err && err.type !== 'NotFoundError') {
			return cb(err);
		}
		cb(null, next && Buffer.from(next, 'hex'));
	});
}

function getChain (db, hash, cb) {
	db.get(ENTRY_CHAIN + hexify(hash), function (err, chain) {
		if (err && err.type !== 'NotFoundError') {
			return cb(err);
		}

		cb(null, chain && Buffer.from(chain, 'hex'));
	});
}
