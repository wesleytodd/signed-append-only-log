/* global describe, it */
const assert = require('assert');
const mockLog = require('./util/mock-log');
const MemoryStore = require('../lib/memory-store');
const Entry = require('../lib/entry');
const Signatory = require('../lib/signatory');
const hashEntry = require('../lib/hash-entry');

describe('verification', function () {
	it('should verify the log', function (done) {
		mockLog(['foo', 'bar', 'baz'], function (log) {
			log.verify(function (err, verified) {
				assert(!err);
				assert(verified);
				done();
			});
		});
	});

	it('should fail to verify the log if content is modified', function (done) {
		// Make a memory store we have access to
		var store = new MemoryStore();

		mockLog(['foo', 'bar', 'baz'], {store}, function (log) {
			store._tail.entry.data = Buffer.from('fake').toString('hex');

			log.verify(function (err, verified) {
				assert.equal(err.code, log.verify.E_INVALID_HASH);
				assert(!verified);
				done();
			});
		});
	});

	it('should fail to verify the log if content is modified', function (done) {
		// Make a memory store we have access to
		var store = new MemoryStore();

		mockLog(['foo', 'bar', 'baz'], {store}, function (log) {
			store._tail.entry = new Entry(Buffer.from('fake'), 3, 'fakesig', store._tail.hash);

			log.verify(function (err, verified) {
				assert.equal(err.code, log.verify.E_PREV_HASH);
				assert(!verified);
				done();
			});
		});
	});

	it('should fail to verify the log if the signature is invalid', function (done) {
		// Make a memory store we have access to
		var store = new MemoryStore();

		mockLog(['foo', 'bar', 'baz'], {store}, function (log) {
			var buf = Buffer.from('foo');
			var sig = new Signatory();
			var signature = sig.sign(buf);
			var entry = new Entry(buf, 4, signature, store._tail.hash);
			var h = hashEntry(entry);
			store._tail.next = {
				hash: h,
				entry: entry,
				prev: store._tail,
				next: null
			};
			store._hash[h] = store._tail.next;

			log.verify(function (err, verified) {
				assert.equal(err.code, log.verify.E_INVALID_SIG);
				assert(!verified);
				done();
			});
		});
	});
});
