/* global describe, it, beforeEach, afterEach */
const assert = require('assert');
const series = require('run-series');
const memdown = require('memdown');
const {createEntry} = require('../');
const {hashEntry} = require('../lib/entry');
const LevelStore = require('../lib/stores/level');
const createSignatory = require('./util/create-signatory');
const createEntries = require('./util/create-entries');
const debugLevel = require('./util/debug-level');

describe('LevelStore', function () {
	// Create a signatory and store for each test
	var sig;
	var store;
	beforeEach(function (done) {
		// Generate a keypair for the signatory to write with
		createSignatory(function (si) {
			sig = si;
			LevelStore({
				location: 'test',
				db: memdown
			}, function (err, st) {
				assert(!err);
				store = st;
				done();
			});
		});
	});
	afterEach(function (done) {
		if (process.env.DEBUG) {
			debugLevel(store.db, function () {
				store.close(function (err) {
					assert(!err);
					done();
				});
			});
		} else {
			store.close(function (err) {
				assert(!err);
				done();
			});
		}
	});

	it('should write and get the initial block', function (done) {
		createEntry(Buffer.from('foo'), null, sig, function (err, entry) {
			assert(!err, err);

			var h = hashEntry(entry);
			store.put(h, entry, function (err) {
				assert(!err, err);

				store.get(h, function (err, entry, prev, next) {
					assert(!err, err);
					assert(entry);
					assert.equal(entry.content.payload.toString('utf8'), 'foo');
					assert.equal(entry.content.prev, null);
					assert.equal(prev, null);
					assert.equal(next, null);
					done();
				});
			});
		});
	});

	it('should append and get blocks', function (done) {
		var prev = null;
		createEntries(['foo', 'bar', 'baz'], sig, function (entries) {
			series(entries.map(function (e) {
				return function (cb) {
					var h = hashEntry(e);
					store.put(h, e, function (err) {
						assert(!err, err);
						store.get(h, function (err, entry, p, next) {
							assert(!err, err);
							assert(entry);
							assert(entry.content.payload.equals(e.content.payload));
							entry.content.prev && assert(entry.content.prev.equals(prev));
							p && assert(p.equals(prev));
							prev = h;
							assert.equal(next, null);
							cb();
						});
					});
				};
			}), done);
		});
	});
});
