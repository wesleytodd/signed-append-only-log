'use strict';
const crypto = require('crypto');

module.exports = function hashEntry (entry) {
	return crypto.createHash('sha256').update(JSON.stringify(entry)).digest();
};
