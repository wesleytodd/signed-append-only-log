'use strict';

module.exports = function Entry (data, sequence, signature, prev) {
	this.sequence = sequence;
	this.timestamp = new Date();
	this.data = data;
	this.signature = signature;
	this.prev = prev;
};
