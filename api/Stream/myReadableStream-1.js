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
	console.log('read data from myReadableStream',s);
    s=m.read();
}
/*
执行 read() 时，如果缓存中数据不够，会调用 _read() 去底层取
_read 方法中可以同步或异步地调用 push(data) 来将底层数据交给流处理
在上面的例子中，由于是同步调用 push 方法，数据会添加到缓存中。
read 方法在执行完 _read 方法后，便从缓存中取数据，再返回，且以 data 事件输出
*/
/*
结果：
data 1
read data from myReadableStream
data 2
read data from myReadableStream
end
*/