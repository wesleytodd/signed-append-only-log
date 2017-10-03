'use strict';
const app = require('express')();
const bodyParser = require('body-parser');
const write = require('@wesleytodd/signed-append-only-log/lib/write');
const Ed25519Sig = require('@wesleytodd/signed-append-only-log/lib/signatories/ed25519');
const {fromJSON, toJSON} = require('@wesleytodd/signed-append-only-log/lib/entry');
const LevelStore = require('@wesleytodd/signed-append-only-log/lib/stores/level');
const debugLevel = require('../../test/util/debug-level');

// Keep the reference to the log store once we make it
var logStore;

// Parse json bodies
app.use(bodyParser.json());

// Append a block to the log, creates a new one if it doesn't yet exist
app.post('/log', function (req, res) {
	// Basic input validation
	if (!req.body.signatureType || req.body.signatureType !== 'ed25519') {
		return res.status(400).json({
			message: 'Invalid signature type',
			code: 'invalidSignatureType',
			type: req.body.signatureType,
			supportedTypes: ['ed25519']
		});
	}
	if (!req.body.signature) {
		return res.status(400).json({
			message: 'Entry signature is required',
			code: 'missingSignature'
		});
	}
	if (!req.body.content) {
		return res.status(400).json({
			message: 'Entry content is required',
			code: 'missingContent'
		});
	}
	if (!req.body.content.payload || !req.body.content.key) {
		return res.status(400).json({
			message: 'Invalid entry content',
			code: 'invalidContent'
		});
	}

	// Create the entry from the body
	var entry = fromJSON(req.body);

	// Create the signatory
	var signatory = new Ed25519Sig(entry.content.key);

	write(logStore, signatory, entry, function (err, hash) {
		if (err) {
			console.error(err);
			return res.status(204).send();
		}
		res.status(200).json({
			hash: hash.toString('hex')
		});
	});
});

// Get entries in a log
app.get('/log/:id', function (req, res) {
	var q = req.query || {};

	// Accumulate the data
	var error;
	var entries = [];

	var s = logStore.createReadStream(req.params.id, {
		limit: q.limit || 20,
		from: q.from,
		reverse: typeof q.reverse !== 'undefined' && q.reverse !== 'false'
	});

	// Handle errors
	s.on('error', function (err) {
		console.error(err);
		error = err;
	});

	// On log entry
	s.on('data', function (d) {
		entries.push({
			hash: d.hash.toString('hex'),
			entry: d.entry
		});
	});

	// Respond on stream end
	s.on('end', function (entry) {
		if (error) {
			return res.status(500).send();
		}

		res.status(200).json({
			entries: entries
		});
	});
});

// Get a specific block by id
app.get('/block/:id', function (req, res) {
	logStore.get(Buffer.from(req.params.id, 'hex'), function (err, entry, prev, next) {
		if (err) {
			console.error(err);
			return res.status(500).send();
		}

		// Missing entry
		if (!entry) {
			return res.status(404).send();
		}

		res.status(200).json({
			entry: toJSON(entry),
			prev: prev ? prev.toString('hex') : null,
			next: next ? next.toString('hex') : null
		});
	});
});

app.get('/debug', function (req, res) {
	debugLevel(logStore.db, function () {
		res.status(204).send();
	});
});

// At app startup, create the sotre and the log
LevelStore({
	location: '.db'
}, function (err, store) {
	if (err) {
		console.error(err);
		process.exit(1);
	}

	// Give app access to the store
	logStore = store;

	// Start server
	var server = app.listen(0, function (err) {
		if (err) {
			return console.error(err);
		}
		console.log(`Server open on http://localhost:${server.address().port}`);
	});
});
