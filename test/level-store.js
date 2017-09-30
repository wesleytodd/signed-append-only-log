/* global describe, it, beforeEach, afterEach */
const assert = require('assert');
const path = require('path');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');
const series = require('run-series');
const LevelStore = require('../lib/stores/level');
const Ed25519Sig = require('../lib/signatories/ed25519');
const {createEntry} = require('../');
const {hashEntry} = require('../lib/entry');
const createEntries = require('./util/create-entries');
const debugLevel = require('./util/debug-level');
const TMP = path.join(__dirname, 'tmp');

describe.only('LevelStore', function () {
	// Create a signatory and store for each test
	var sig;
	var store;
	beforeEach(function (done) {
		mkdirp.sync(TMP);

		// Generate a keypair for the signatory to write with
		Ed25519Sig.generateKeypair(function (err, keypair) {
			assert(!err);

			// Create signatory to sign with
			sig = new Ed25519Sig(keypair.publicKey, keypair.privateKey);

			LevelStore({
				location: path.join(TMP, 'db')
			}, function (err, s) {
				assert(!err);
				store = s;
				done();
			});
		});
	});
	afterEach(function (done) {
		debugLevel(store.db, function () {
			store.close(function (err) {
				assert(!err);
				rimraf.sync(TMP);
				done();
			});
		});
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
