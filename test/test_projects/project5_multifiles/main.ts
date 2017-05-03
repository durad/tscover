
if (process.argv.indexOf('-a') != -1) {
	let a = require('./a').a;
	console.log(a());
}

if (process.argv.indexOf('-b') != -1) {
	let b = require('./b').b;
	console.log(b());
}

if (process.argv.indexOf('-c') != -1) {
	let c = require('./c').c;
	console.log(c());
}
