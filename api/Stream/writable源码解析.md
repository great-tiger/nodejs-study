```
关注源码本身是没有意义的，阅读源码是为了深入理解api。
本文研究了:
write  end cork uncork 方法
pipe unpipe finish drain 事件

另外Writable还提供close error 事件
error 就不多说啦
close 流关闭时触发，并不是所有的Writable都实现了。估计是要维护连接的流提供吧，不再本文研究范围内。



实现一个writable Stream 需要同时重写_write _writev 方法

_write(chunk,encoding,cb) 一次只能向媒介写入一个chunk
_writev(chunks,cb) 一次可以向媒介写入多个chunk   chunks结构{ chunk: ..., encoding: ... }

write(chunk) 写入的chunk与 _write(chunk)接收的chunk是同一个单位，因为writeable中维护的是队列。

调用_write或_writev方法完成后，一定要调用cb，来通知writable对象。cb的签名是cb(err)。如果没有错误，就直接cb()就可以啦。

1、如果我们往writable流中写啊写，很容易把缓冲区写满的，我们怎么能得到反馈呢？
write 的返回值为false时，证明缓冲区已经写满啦，小伙伴们就不要在往里面写啦。可以写的时候它会通知你的，实质上是通过drain事件通知的。

2、cork模式
当处于corked模式时，写入stream的数据被加入队列直到该stream被uncorked。
使用场景：Node.js会合并小的写入数据，从而减少系统调用_write _writev，从而提高性能
看看源码如何实现的：
function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
  var ret = state.length < state.highWaterMark;
  if (state.writing || state.corked) {
     //数据写入缓冲区
     //...
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }
  return ret;
}

Writable.prototype.cork = function () {
  var state = this._writableState;
  state.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;
  if (state.corked) {
    state.corked--;
    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest)
        clearBuffer(this, state);//调用_writev消费缓冲区中的数据
  }
};

state.corked的默认值为0，这里为什么用整数做flag，还不是很理解。
write方法会调用writeOrBuffer，当corked大于0时，数据会被缓存。

官方建议通过process.nextTick调用uncork()方法，这个具体就不探究啦。

3、如果我们不管write方法的返回值，一直写会不会出现内存泄漏呢？
用下面的程序测试了一下，真会的。
var readable = require('readable-stream');
var inherits = require('inherits');

var write = readable.Writable();
write._write = function(chunk, encoding, cb) {
     console.log('chunk', chunk);
     //cb(null, chunk); 不消费
};
while (true)
     write.write('a');

最终报错：
FATAL ERROR: MarkCompactCollector: semi-space copy, fallback in old gen Allocation failed - JavaScript heap out of memory

4、end 方法的作用就是通知writable，我已经写完啦，不会往里面再写数据啦。下面看一下源码：
Writable.prototype.end = function (chunk, encoding, cb) {
  //调用end的时候，我们也可以写数据
  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork(); //有可能会清理缓存数据，调用_writev来消费
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished) endWritable(this, state, cb);
};
function endWritable(stream, state, cb) {
  state.ending = true;
  if (cb) {
    //如果已经完成啦，就直接cb。如果没有就添加到finish事件监听中
    if (state.finished) processNextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}
5、finish事件，数据已经被消费完时触发。官方语言：所有数据已被写入到底层系统时触发
6、pipe unpipe 事件，这两个事件的触发并不是由Writable来做的，而是由Readable。下面时官方给出的例子

const writer = getWritableStreamSomehow();
const reader = getReadableStreamSomehow();
writer.on('pipe', (src) => {
  console.error('something is piping into the writer');
  assert.equal(src, reader);
});
reader.pipe(writer);


const writer = getWritableStreamSomehow();
const reader = getReadableStreamSomehow();
writer.on('unpipe', (src) => {
  console.error('Something has stopped piping into the writer.');
  assert.equal(src, reader);
});
reader.pipe(writer);
reader.unpipe(writer);

这部分在研究Readable的pipe操作时再分析。注意:Readable  提供了pipe unpripe方法，而不是事件。
```