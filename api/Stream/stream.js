/*
* 在实际开发不要用require('stream') 因为node版本问题
* 提倡使用https://github.com/nodejs/readable-stream
* */

/*
* stream 是一个构造函数 即成EventEmitter
* stream.Readable 是一个构造函数，继承stream
*
* */
var stream=require('stream');
var readable=stream.Readable;
var writable=stream.Writable;

//继承 Duplex 用来修改流中的内容
var transform=stream.Transform;

//继承 Readable 可读可写，但是为什么只继承Readable,难道有什么黑魔法。
//实现代码：https://github.com/nodejs/readable-stream/blob/master/lib/_stream_duplex.js
//看一下代码就知道了，把Writable的属性，拷贝了一下。
// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.
var duplex=stream.Duplex;

/*
 Both Writable and Readable streams use the EventEmitter API in various ways to communicate the current state of the stream.
 Duplex and Transform streams are both Writable and Readable.
 */