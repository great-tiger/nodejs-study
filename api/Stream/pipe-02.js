/*
使用 pipe() 时，数据的生产和消耗形成了一个闭环。

通过负反馈调节上游的数据生产节奏，事实上形成了一种所谓的拉式流（ pull stream ）。

用喝饮料来说明拉式流和普通流的区别的话，普通流就像是将杯子里的饮料往嘴里倾倒，动力来源于上游，数据是被推往下游的；拉式流则是用吸管去喝饮料，动力实际来源于下游，数据是被拉去下游的。

所以，使用拉式流时，是“按需生产”。

如果下游停止消耗，上游便会停止生产。

所有缓存的数据量便是两者的阈值和。

当使用 Transform 作为下游时，尤其需要注意消耗。
*/

var stream = require('readable-stream');

var c = 0;
const readable = stream.Readable({
    highWaterMark: 2,
    read: function() {
        process.nextTick(() => {
            var data = c < 26 ? String.fromCharCode(c++ + 97) : null
            console.log('push', data)
            this.push(data)
        })
    }
})

const transform = stream.Transform({
    highWaterMark: 2,
    transform: function(buf, enc, next) {
        console.log('transform', buf);
        next(null, buf)
    }
});

readable.pipe(transform);

/*
push a
transform <Buffer 61>
push b
transform <Buffer 62>
push c
push d
push e
push f
*/

/*
可见，并没有将26个字母全生产出来。

Transform 中有两个缓存：可写端的缓存和可读端的缓存。

调用 transform.write() 时，如果可读端缓存未满，数据会经过变换后加入到可读端的缓存中。

当可读端缓存到达阈值后，再调用 transform.write() 则会将写操作缓存到可写端的缓存队列。

当可写端的缓存队列也到达阈值时， transform.write() 返回 false ，上游进入暂停模式，不再继续 transform.write() 。

所以，上面的 transform 中实际存储了4个数据， ab 在可读端（经过了 _transform 的处理）， cd 在可写端（还未经过 _transform 处理）。

此时，由前面一节的分析可知， readable 将缓存 ef ，之后便不再生产数据。

这三个缓存加起来的长度恰好为6，所以一共就生产了6个数据。

要想将26个数据全生产出来，有两种做法。

第一种是消耗 transform 中可读端的缓存，以拉动上游的生产：

readable.pipe(transform).pipe(process.stdout)

第二种是，不要将数据存入可读端中，这样可读端的缓存便会一直处于数据不足状态，上游便会源源不断地生产数据：

const transform = stream.Transform({
  highWaterMark: 2,
  transform: function (buf, enc, next) {
    next()
  }
})
*/
