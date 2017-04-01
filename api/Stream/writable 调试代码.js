var readable = require('readable-stream');
var inherits = require('inherits');

var write = readable.Writable();
write._write = function(chunk, encoding, cb) {
    console.log('chunk', chunk);
    cb(null, chunk);
};
write.write('a');
