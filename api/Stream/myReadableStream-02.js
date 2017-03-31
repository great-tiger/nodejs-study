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