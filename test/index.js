/* global describe, it */
const assert = require('assert');
const mockLog = require('./util/mock-log');

describe('log', function () {
	it('should write and increment sequence', function (done) {
		mockLog(['foo'], function (log) {
			log.sequence(function (err, seq) {
				assert(!err);
				assert.equal(seq, 1);
				done();
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
					assert(value.data.equals(seq === 2 ? Buffer.from('foo') : Buffer.from('bar')));
					assert.equal(value.sequence, seq--);
					next && assert.equal(next, key);
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
					assert(value.data.equals(Buffer.from(d[seq - 1])), seq + ' ' + value.data.toString('utf8'));
					seq--;
				})
				.on('error', function (err) {
					throw err;
				})
				.on('end', done);
		});
	});
});
