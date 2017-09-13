/* global describe, it */
const assert = require('assert');
const crypto = require('crypto');
const mockLog = require('./util/mock-log');
const MemoryStore = require('../lib/stores/memory');
const {Entry, EntryContent, hashEntry} = require('../lib/entry');
const Signatory = require('../lib/signatories/ed25519');
const errors = require('../lib/errors');

describe('verification', function () {
	it('should verify the log', function (done) {
		mockLog(['foo', 'bar', 'baz'], function (log) {
			log.verify(function (err, verified) {
				assert(!err, err);
				assert(verified);
				done();
			});
		});
	});

	it('should fail to verify the log if a payload is modified', function (done) {
		// Make a memory store we have access to
		var store = new MemoryStore();

		mockLog(['foo', 'bar', 'baz'], {store}, function (log) {
			store._tail.entry.content.payload = Buffer.from('fake');

			log.verify(function (err, verified) {
				assert.equal(err.code, errors.E_INVALID_HASH);
				assert(!verified);
				done();
			});
		});
	});

	it('should fail to verify the log if previous hash does not match', function (done) {
		// Make a memory store we have access to
		var store = new MemoryStore();

		mockLog(['foo', 'bar', 'baz'], {store}, function (log, sig) {
			var ec = new EntryContent(Buffer.from('fake'), null, sig.publicKey);
			sig.sign(ec.toBuffer(), function (err, signature) {
				assert(!err, err);
				var e = new Entry(ec, signature, sig.type);
				store._tail.entry = e;
				store._tail.hash = hashEntry(e);
				store._hash.set(store._tail.hash, store._tail);
				log.verify(function (err, verified) {
					assert.equal(err.code, errors.E_PREV_HASH);
					assert(!verified);
					done();
				});
			});
		});
	});

	it('should fail to verify the log if the signature is invalid', function (done) {
		// Make a memory store we have access to
		var store = new MemoryStore();

		mockLog(['foo', 'bar', 'baz'], {store}, function (log) {
			Signatory.generateKeypair(function (err, keypair) {
				assert(!err);
				crypto.randomBytes(64, function (err, buf) {
					assert(!err);

					var head = store._head;
					store._hash.delete(head.hash);
					head.entry.signature = buf;
					head.hash = hashEntry(head.entry);
					head.prev.next.hash = head.hash;
					store._hash.set(head.hash, head);

					log.verify(function (err, verified) {
						assert.equal(err.code, errors.E_INVALID_SIG);
						assert(!verified);
						done();
					});
				});
			});
		});
	});
});
