
/// <reference path="headercode.d.ts" />

g.__tscover__ = g.__tscover__ || { hash: '__projectHash__', data: {} };
let projectHash = '__projectHash__';
let tscover = g.__tscover__;
tscover.data['__filename__'] = tscover.data['__filename__'] || {
	s: __statements__,
	b: __branches__,
	hash: '__fileHash__',
	sourceCode: sourceCode
};

let fs = (typeof r === 'function') ? r('fs') : null;
let path = (typeof r === 'function') ? r('path') : null;
