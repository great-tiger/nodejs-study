var readable = require('readable-stream');
var inherits = require('inherits');

var myStream = function(opt) {
    readable.Readable.call(this, opt);
};
inherits(myStream, readable.Readable);
var data = ["1", "2", "3"];
myStream.prototype._read = function() {
    var d = data.splice(0, 1)[0];
    if (data.length == 0)
        this.push(null);
    else
        this.push(d);
};
var m = new myStream();
m.on('data', function(chunk) {
    console.log('data', String(chunk));
});
m.on('end', function() {
    console.log('end');
});
