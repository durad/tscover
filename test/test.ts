
import * as path from 'path';
import * as child_process from 'child_process';

async function delay() {
	return new Promise(resolve => {
		setTimeout(resolve, 100);
	})
}

async function coverProject(projectName: string) {
	child_process.execSync(`tscover -p ${path.resolve(projectName)}`);
}

suite('tscover', function() {
	this.timeout(10 * 1000);

	// suiteSetup(function() {
	// 	console.log('suiteSetup');
	// });

	// setup(function() {
	// 	console.log('setup');
	// });

	test('should return -1 when not present', function() {
		coverProject('tssample1');
	});

	// test('should return -1 when not present', function() {
	// 	console.log('test2');
	// });

	// suite('subsuite...', function() {

	// 	test('should return -1 when not present', function() {
	// 		console.log('test11');
	// 	});

	// 	test('should return -1 when not present', function() {
	// 		console.log('test22');
	// 	});

	// 	test('', async () => {
	// 		for (let i = 0; i < 10; i++) {
	// 			await delay();
	// 			console.log(i);
	// 		}
	// 	});
	// })

	// teardown(function() {
	// 	console.log('teardown');
	// });

	// suiteTeardown(function() {
	// 	console.log('suiteTeardown');
	// });
});
