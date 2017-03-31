const stream = require('readable-stream');

var c = 0
const readable = stream.Readable({
  highWaterMark: 2,
  read: function () {
    process.nextTick(() => {
      var data = c < 6 ? String.fromCharCode(c + 65) : null
      console.log('push', ++c, data)
      this.push(data)
    })
  }
})

const writable = stream.Writable({
  highWaterMark: 2,
  write: function (chunk, enc, next) {
    console.log('write', chunk);
  }
});

readable.pipe(writable);
// back pressure 个人觉得是：后面缓存区不满时，前面的才往里面放。后面的满了，就先别急着放了。通过后面的压力，调节前面的节奏。

/*
输出：
push 1 A
write <Buffer 41>
push 2 B
push 3 C
push 4 D
*/

/*
解释上面的现象
虽然上游一共有6个数据（ ABCDEF ）可以生产，但实际只生产了4个（ ABCD ）。

这是因为第一个数据（ A ）迟迟未能写完（未调用 next() ），所以后面通过 write 方法添加进来的数据便被缓存起来。

下游的缓存队列到达2时， write 返回 false ，上游切换至暂停模式。

此时下游保存了 AB 。

由于 Readable 总是缓存 state.highWaterMark 这么多的数据，所以上游保存了 CD 。

从而一共生产出来 ABCD 四个数据。
*/

/*
//Readable 函数，生成 Readable 对象。配置参数中的read,即是 _read。
function Readable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  if (!(this instanceof Readable)) return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options && typeof options.read === 'function') this._read = options.read;

  Stream.call(this);
}

*/

/*
用 pipe 方法连接上下游：

const fs = require('fs')
fs.createReadStream(file).pipe(writable)

writable 是一个可写流 Writable 对象，上游调用其 write 方法将数据写入其中。

writable 内部维护了一个写队列，当这个队列长度达到某个阈值（ state.highWaterMark ）时，

执行 write() 时返回 false ，否则返回 true 。

于是上游可以根据 write() 的返回值在流动模式和暂停模式间切换：

readable.on('data', function (data) {
  if (false === writable.write(data)) {
    readable.pause()
  }
})

writable.on('drain', function () {
  readable.resume()
})
上面便是 pipe 方法的核心逻辑。

当 write() 返回 false 时，调用 readable.pause() 使上游进入暂停模式，不再触发 data 事件。

但是当 writable 将缓存清空时，会触发一个 drain 事件，再调用 readable.resume() 使上游进入流动模式，继续触发 data 事件。

*/