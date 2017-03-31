var fs=require('fs');

//返回一个可读流
var readable=fs.createReadStream('./data.txt');

console.log(readable);


