/* eslint-disable */
'use strict';
const {fromJSON} = require('../../lib/entry');

module.exports = function debugLevel (db, done) {
	// return done();
	db.createReadStream()
		.on('data', function ({key, value}) {
			var di = key.indexOf(':');
			var keyType = key.slice(0, di);
			var keyVal = key.slice(di + 1);

			console.log({
				type: keyType,
				key: keyVal,
				value: keyType === 'ENTRY' ? fromJSON(JSON.parse(value)) : value
			});
		})
		.on('end', function () {
			console.log('=============');
			done();
		});
};
