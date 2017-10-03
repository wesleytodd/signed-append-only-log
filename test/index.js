/* global describe, it, before */
const assert = require('assert');
const createSignatory = require('./util/create-signatory');
const createEntries = require('./util/create-entries');
const createLog = require('./util/create-log');
const {hashEntry} = require('../lib/entry');

describe('log', function () {
	var sig;
	before(function (done) {
		createSignatory(function (s) {
			sig = s;
			done();
		});
	});

	it('should create entries', function (done) {
		createEntries(['foo', 'bar'], sig, function (entries) {
			// console.log(JSON.stringify(entries, null, '\t'));
			// Entry 1
			var e1 = entries[0];
			assert.equal(e1.content.payload.toString(), 'foo');
			assert.equal(e1.content.prev, null);
			assert.equal(e1.signatureType, 'ed25519');

			// Entry 2
			var e2 = entries[1];
			assert.equal(e2.content.payload.toString(), 'bar');
			assert.equal(e2.content.prev.toString('hex'), hashEntry(e1).toString('hex'));
			assert.equal(e2.signatureType, 'ed25519');

			done();
		});
	});

	it('should write and get entries', function (done) {
		createLog(['foo', 'bar', 'baz'], sig, function (log, entries) {
			log.get(hashEntry(entries[0]), function (err, e) {
				assert(!err);
				console.log(e);
				done();
			});
		});
	});

	/*
	it('should write and get logs', function (done) {
		mockLog(['foo'], function (log) {
			log.head(function (err, head) {
				assert(!err);
				log.get(head, function (err, entry) {
					assert(!err);
					assert.equal(entry.content.payload.toString('utf8'), 'foo');
					assert.equal(entry.prev, null);
					done();
				});
			});
		});
	});

	it('should read from a stream', function (done) {
		mockLog(['foo', 'bar'], function (log) {
			var seq = 2;
			var next;
			log.createReadStream()
				.on('data', function ({key, value}) {
					assert(key);
					assert(value);
					assert(value.content.payload.equals(seq === 2 ? Buffer.from('foo') : Buffer.from('bar')));
					next && assert.equal(next, key);
					seq--;
					next = value.prev;
				})
				.on('error', function (err) {
					throw err;
				})
				.on('end', done);
		});
	});

	it('should read from a stream in reverse', function (done) {
		var d = ['foo', 'bar', 'baz'];
		mockLog(d, function (log) {
			var seq = 3;
			log.createReadStream({
				reverse: true
			})
				.on('data', function ({key, value}) {
					assert(key);
					assert(value);
					assert(value.content.payload.equals(Buffer.from(d[seq - 1])), seq + ' ' + value.content.payload.toString('utf8'));
					seq--;
				})
				.on('error', function (err) {
					throw err;
				})
				.on('end', done);
		});
	});
	*/
});
