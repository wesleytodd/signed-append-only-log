'use strict';
const {Readable} = require('readable-stream');
const inherits = require('inherits');

var Store = module.exports = function Store () {
	this._sequence = 0;
	this._tail = null;
	this._head = null;
	this._hash = {};
};

Store.prototype.put = function (hash, entry, cb) {
	this._sequence = entry.sequence;
	var node = {
		hash: hash,
		entry: entry,
		prev: this._tail,
		next: null
	};
	this._hash[hash] = node;
	this._head = this._head || node;
	this._tail && (this._tail.next = node);
	this._tail = node;
	process.nextTick(function () {
		cb();
	});
};

Store.prototype.get = function (hash, cb) {
	process.nextTick(() => {
		var n = this._hash[hash];
		if (!n) {
			return cb();
		}

		cb(null, n.entry, n.prev && n.prev.hash, n.next && n.next.hash);
	});
};

Store.prototype.sequence = function (cb) {
	process.nextTick(() => {
		cb(null, this._sequence);
	});
};

Store.prototype.tail = function (cb) {
	process.nextTick(() => {
		cb(null, this._tail && this._tail.hash);
	});
};

Store.prototype.createReadStream = function (options = {}) {
	return new MemoryStoreReadStream({
		store: this,
		highWaterMark: options.highWaterMark,
		reverse: options.reverse
		// @TODO
		// gt: options.gt,
		// gte: options.gte,
		// lt: options.lt,
		// lte: options.lte,
		// limit: options.limit,
	});
};

/* @TODO
Store.prototype.createKeyStream = function () {
	return new MemoryStoreReadStream(this);
};

Store.prototype.createValueStream = function () {
	return new MemoryStoreReadStream(this);
};
*/

function MemoryStoreReadStream (opts = {}) {
	Readable.call(this, {
		objectMode: true,
		highWaterMark: opts.highWaterMark
	});
	this.store = opts.store;
	this.cursor = opts.reverse ? this.store._head.hash : this.store._tail.hash;

	// Options
	// this.gt = opts.gt;
	// this.gte = opts.gte;
	// this.lt = opts.lt;
	// this.lte = opts.lte;
	// this.limit = opts.limit;
	this.reverse = opts.reverse;
}
inherits(MemoryStoreReadStream, Readable);

MemoryStoreReadStream.prototype._read = function _read () {
	// At the end of the stream
	if (!this.cursor) {
		return this.push(null);
	}

	this.store.get(this.cursor, (err, entry, prev, next) => {
		if (err) {
			return this.emit('error', err);
		}

		// We had a hash, but got no entry for it, should be an error
		if (!entry) {
			return this.emit('error', new Error('Missing entry for hash ' + this.cursor));
		}

		// Update cursor
		var cur = this.cursor;
		this.cursor = this.reverse ? next : prev;

		// @TODO
		// Check if it is within range before pushing (gt, gte, lt, lte, limit)

		// Push into stream
		this.push({
			key: cur,
			value: entry
		});
	});
};
