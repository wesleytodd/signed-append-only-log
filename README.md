# Signed Append Only Log

[![NPM Version](https://img.shields.io/npm/v/@wesleytodd/saol.svg)](https://npmjs.org/package/@wesleytodd/saol)
[![NPM Downloads](https://img.shields.io/npm/dm/@wesleytodd/saol.svg)](https://npmjs.org/package/@wesleytodd/saol)

[![js-happiness-style](https://img.shields.io/badge/code%20style-happiness-brightgreen.svg)](https://github.com/JedWatson/happiness)

An append only log with content hashes and signatures for verification and integrity checking.

## Install

```
$ npm install --save @wesleytodd/signed-append-only-log
```

## Usage

```javascript
var createLog = require('@wesleytodd/signed-append-only-log');

// Create a log instance
var log = createLog({
  store: store, // See section on stores
  signatory: signatory // See section on signatories
});

// Write a log
log.write('foo', function (err, hash, entry) {
  if (err) {
    return console.error(err);
  }
  
  // A content hash which is a sha256
  // of the json encoded log entry
  console.log(hash); // <Buffer 80 e2 7f ... >
  
  // The log entry itself
  console.log(entry);
  /*
    Entry {
      sequence: 1,
      timestamp: 2017-09-10T01:51:00.269Z,
      data: <Buffer 66 6f 6f>,
      signature: <Buffer 90 8a 36 ... >,
      prev: null
    }
  */
});

// Once you ave written some logs, you get get them
// on an individual basis via their hashes, or 
// as a stream
log.get(hash, function (err, entry, prevHash, nextHash) {
  if (err) {
    return console.error(err);
  }

  // The entry for the given hash if it existed,
  // the data is always a buffer on the key data
  console.log(entry.data.toString('utf8')); // 'foo'

  // Getting a single entry also returns the,
  // previous and next hashes if there are
  // entries for those, usefull for traversing the log.
  // In this case next is null because this is the last in the log
  console.log(prevHash, nextHash); // <Buffer 90 8a 36 ... > null
});

// The log can also be consumed as a read stream
log.createReadStream()
  .on('data', function ({key: hash, value: entry}) {
    // Similar to the levelup package, which will
    // be one of the data stores to be implemented,
    // a default read stream comes as key/value pairs.
    // Destructured here for legibility
    console.log(hash); // <Buffer ... >
    console.log(entry); // <Entry ... >
  });

// Lastly, you can verify the integrety of the log data
log.verify(function (err, valid) {
  // An error can mean there was an error reading
  // the data from the store, or that an actaull
  // error was found with the data.  If it was
  // a storage reading error, the second parameter
  // will be null.  If the full log was readable,
  // but a specific error was found, it will be false
  // and the error message will report why. You can use
  // the exported constatns to check against
  log.E_TIMESTAMP_ORDER;
  log.E_PREV_HASH: verify.E_PREV_HASH;
  log.E_INVALID_HASH: verify.E_INVALID_HASH;
  log.E_INVALID_SIG: verify.E_INVALID_SIG;
});

```

## Development

The tests can be run with `npm test`, which also runs the linter and any other builds steps for the module.
When a release is ready, use npm to bump the version:

```
$ npm version minor
$ git push
$ npm publish
```

Pull requests should be made against master or the currently active development branch.
