var readable = require('readable-stream');
var inherits = require('inherits');

var myStream = function(opt) {
    readable.Readable.call(this, opt);
};
inherits(myStream, readable.Readable);
var data = ["1", "2", "3"];
myStream.prototype._read = function() {
	var self=this;
	//异步的方式调用push
	//push 方法被调用时，由于是暂停模式，不会立即输出数据，而是将数据放入缓存，并触发一次 readable 事件
    process.nextTick(function(){
    	if(data.length){
    		self.push(data.shift());
    	}else{
    		self.push(null);
    	}
    });
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
m.on('readable',function(){
	console.log('readable');
	//当 read() 返回 null 时，意味着当前缓存数据不够，而且底层数据还没加进来
	while (m.read() !== null);
});
//直接执行while (m.read() !== null);发现什么也没有输出
//我们需要把read放入readable中
/*
输出：
readable
data 1
readable
data 2
readable
data 3
readable
end
*/

//push 方法被调用时，由于是暂停模式，不会立即输出数据，而是将数据放入缓存，并触发一次 readable 事件
//一旦 read 被调用，上面的例子中就会形成一个循环： readable 事件导致 read 方法调用， read 方法又触发 readable 事件
//首次监听 readable 事件时，还会触发一次 read(0) 的调用，从而引起 _read 和 push 方法的调用，从而启动循环。
//总之，在暂停模式下需要使用 readable 事件和 read 方法来消耗流。