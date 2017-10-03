'use strict';
const inherits = require('inherits');
const {Readable} = require('readable-stream');
const errors = require('./errors');

module.exports = StoreReadStream;
function StoreReadStream (store, opts = {}) {
	if (!store) {
		throw new TypeError('store is required');
	}

	this.cursor = opts.cursor;
	this.limit = opts.limit || -1;
	this.reverse = !!opts.reverse;

	// Inherits from readable stream
	Readable.call(this, {
		objectMode: true,
		highWaterMark: opts.highWaterMark,
		read: function storeReadStreamRead () {
			// At the end of the stream
			if (!this.cursor || this.limit === 0) {
				return this.push(null);
			}

			store.get(this.cursor, (err, entry, prev, next) => {
				if (err) {
					return this.emit('error', err);
				}

				// We had a hash, but got no entry for it, should be an error
				if (!entry) {
					return this.emit('error', errors.missingEntry(this.cursor));
				}

				// Update cursor
				var cur = this.cursor;
				this.cursor = this.reverse ? next : prev;

				// Decr limit, if no limit was given
				// this just keeps going forever
				this.limit--;

				// Push into stream
				this.push({
					hash: cur,
					entry: entry
				});
			});
		}
	});
}
inherits(StoreReadStream, Readable);
