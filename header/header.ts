// let __statements__ = null;
// let __branches__ = null;
// let __sourceCode__ = null;
// ---split---

let __fileHash__: any = (new Function('return this'))();
(new Function('g', 'r', 'sourceCode', `

g.__tscover__ = g.__tscover__ || { hash: '__projectHash__', data: {} };
var projectHash = '__projectHash__';
var tscover = g.__tscover__;
tscover.data['__filename__'] = tscover.data['__filename__'] || {
    s: __statements__,
    b: __branches__,
    hash: '__fileHash__',
    sourceCode: sourceCode
};
var fs = (typeof r === 'function') ? r('fs') : null;
var path = (typeof r === 'function') ? r('path') : null;

console.log(typeof r);
console.log(typeof fs);
console.log(typeof path);

`))(__fileHash__, eval('require'), __sourceCode__);

__fileHash__ = __fileHash__.__tscover__.data['__filename__'];
