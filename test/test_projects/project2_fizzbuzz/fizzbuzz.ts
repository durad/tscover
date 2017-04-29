
let max = 100;
let maxIndex = process.argv.indexOf('--max');
if (maxIndex >=0 && process.argv.length > maxIndex + 1) {
	max = parseInt(process.argv[maxIndex + 1]) || max;
}

for (let i = 1; i <= max; i++) {
	if (i % 15 === 0) {
		console.log('FizzBuzz');
	} else if (i % 3 === 0) {
		console.log('Fizz');
	} else if (i % 5 === 0) {
		console.log('Buzz')
	} else {
		console.log(i);
	}
}
