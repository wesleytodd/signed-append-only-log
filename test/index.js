/* global describe, it */
const assert = require('assert');
const mockLog = require('./util/mock-log');

describe('log', function () {
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
});
