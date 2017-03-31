var readable = require('readable-stream');
var inherits = require('inherits');

var myStream = function(opt) {
    readable.Readable.call(this, opt);
};
inherits(myStream, readable.Readable);
var data = ["1", "2", "3"];
myStream.prototype._read = function() {
    var d = data.shift();
    if (data.length == 0)
        this.push(null); //数据读取完成，直接push null 就可以了。null 时有特殊含义的。
    else
        this.push(d); //默认只可以push string buffer 数据
};
var m = new myStream();

m.pause();
//此时调用data,不会进入流动模式,需要不断的调用read获取数据
m.on('data', function(chunk) {
    console.log('data', String(chunk));
});
m.on('end', function() {
    console.log('end');
});

var s = m.read();
while (s !== null) {
	console.log('read data from myReadableStream');
    s=m.read();
}

/*
结果：
data 1
read data from myReadableStream
data 2
read data from myReadableStream
end
*/