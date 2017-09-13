'use strict';
const crypto = require('crypto');
const DELIM = Buffer.from('::');
const NULL = Buffer.from(':null:');

// Create an entry
module.exports = function createEntry (payload, prev, signatory, cb) {
	var ec = new EntryContent(payload, prev, signatory.publicKey);
	signatory.sign(ec.toBuffer(), function (err, signature) {
		if (err) {
			return cb(err);
		}
		cb(null, new Entry(ec, signature, signatory.type));
	});
};

// Export individual components
module.exports.Entry = Entry;
module.exports.EntryContent = EntryContent;
module.exports.hashEntry = hash;

function Entry (content, signature, signatureType) {
	this.content = content;
	this.signature = signature;
	this.signatureType = signatureType;
}

Entry.prototype.toBuffer = function () {
	return Buffer.concat([this.content.toBuffer(), DELIM, this.signature, DELIM, Buffer.from(this.signatureType)]);
};

// Entry content
function EntryContent (payload, prev, key) {
	this.payload = payload;
	this.key = key;
	this.prev = prev;
}

EntryContent.prototype.toBuffer = function () {
	return Buffer.concat([this.key, DELIM, this.prev || NULL, DELIM, this.payload]);
};

function hash (entry) {
	return crypto.createHash('sha512').update(entry.toBuffer()).digest();
}
