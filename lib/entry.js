'use strict';
const crypto = require('crypto');
const DELIM = Buffer.from('::');
const NULL = Buffer.from('|null|');

// Export individual components
module.exports.Entry = Entry;
module.exports.EntryContent = EntryContent;
module.exports.hashEntry = hash;
module.exports.toJSON = toJSON;
module.exports.fromJSON = fromJSON;

function Entry (content, signature, signatureType) {
	this.content = content;
	this.signature = signature;
	this.signatureType = signatureType;
}

Entry.prototype.toBuffer = function () {
	return Buffer.concat([this.content.toBuffer(), DELIM, this.signature, DELIM, Buffer.from(this.signatureType)]);
};

Entry.prototype.toJSON = function () {
	return toJSON(this);
};

// Entry content
function EntryContent (payload, prev, key) {
	this.payload = payload;
	this.prev = prev;
	this.key = key;
}

EntryContent.prototype.toBuffer = function () {
	return Buffer.concat([this.key, DELIM, this.prev || NULL, DELIM, this.payload]);
};

function hash (entry) {
	return crypto.createHash('sha512').update(entry.toBuffer()).digest();
}

function toJSON (entry) {
	return {
		content: {
			payload: entry.content.payload.toString('hex'),
			prev: entry.content.prev && entry.content.prev.toString('hex'),
			key: entry.content.key.toString('hex')
		},
		signature: entry.signature.toString('hex'),
		signatureType: entry.signatureType
	};
}

function fromJSON (json) {
	var ec = new EntryContent(
		Buffer.from(json.content.payload, 'hex'),
		json.content.prev && Buffer.from(json.content.prev, 'hex'),
		Buffer.from(json.content.key, 'hex')
	);
	return new Entry(ec, Buffer.from(json.signature, 'hex'), json.signatureType);
}
