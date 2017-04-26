
import * as path from 'path';
import * as child_process from 'child_process';
import * as assert from 'assert';


async function exec(command: string, params: string[]) {
	return new Promise((resolve, reject) => {
		let proc = child_process.spawn(command, params);

		let all = [];
		let stdout = [];
		let stderr = [];

		proc.stdout.on('data', chunk => {
			stdout.push(chunk.toString());
			all.push(chunk.toString());
		});

		proc.stderr.on('data', chunk => {
			stderr.push(chunk.toString());
			all.push(chunk.toString());
		});

		proc.on('exit', (code: number, signal: string) => {
			resolve({
				code,
				signal,
				stdout: stdout.join(''),
				stderr: stderr.join(''),
				all: all.join('')
			});
		});
	});
}

async function execSafe(command: string, params: string[]) {
	let result: any = await exec(command, params);

	if (result.code !== 0) {
		throw new Error(`Command ${command} exited with code ${result.code}\n${result.all}`);
	}

	if (result.signal !== null) {
		throw new Error(`Command ${command} exited with signal ${result.signal}\n${result.all}`);
	}

	return result;
}

async function coverProject(projectName: string) {
	return await execSafe(`tscover`, [`-p`, `${path.join(__dirname, `test_projects`, projectName)}`]);
}

suite('tscover', function() {
	this.timeout(10 * 1000);

	// suiteSetup(async () => {
	// 	await execSafe('rm', ['-rf', 'test_projects/*.js']);
	// });

	test('--help should output typescript help', async () => {
		let r = await execSafe('tscover', ['--help']);

		assert(/^Version/.test(r.stdout));
		assert(/Syntax:\s*tsc \[options\] \[file ...\]/.test(r.stdout));
	});

	test('should cover project: project1_helloworld', async () => {
		await coverProject('project1_helloworld');
	});

	test('should cover project: project2', async () => {
		await coverProject('project2');
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
