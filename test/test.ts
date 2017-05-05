
import * as path from 'path';
import * as fs from 'fs';
import * as child_process from 'child_process';
import * as assert from 'assert';


let tscoverPath = path.join(__dirname, './../bin/tscover.js');
let projectsRoot = path.join(__dirname, 'test_projects');

function projectFolder(projectName: string) {
	return path.join(projectsRoot, projectName);
}

async function exec(command: string, options?: any) {
	return new Promise((resolve, reject) => {
		let proc = child_process.exec(command, options);

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

async function execSafe(command: string, options?: any) {
	let result: any = await exec(command, options);

	if (result.code !== 0) {
		throw new Error(`Command ${command} exited with code ${result.code}\n${result.all}`);
	}

	if (result.signal !== null) {
		throw new Error(`Command ${command} exited with signal ${result.signal}\n${result.all}`);
	}

	return result;
}

async function cover(fileName: string) {
	let result = await execSafe(`${tscoverPath} ${fileName}`);

	if (result.all !== '') {
		throw new Error(`tscover output:\n${result.all}`);
	}
}

async function coverProject(projectName: string, params: string = '') {
	let result = await execSafe(`${tscoverPath} -p ${projectFolder(projectName)} ${params}`);

	if (result.all !== '') {
		throw new Error(`tscover output:\n${result.all}`);
	}
}

suite('tscover', function() {
	this.timeout(30 * 1000);
	this.slow(8 * 1000);

	setup(async () => {
		await execSafe(`find ${projectsRoot} -type f -name '*.js' -delete`);
		await execSafe(`find ${projectsRoot} -type d -name 'coverage' | xargs rm -rf`);
		await execSafe(`find ${projectsRoot} -type d -name 'built' | xargs rm -rf`);
	});

	test('--help should output typescript help', async () => {
		await execSafe(`find ${projectFolder('project1_helloworld')} -type f -name '*.js' -delete`);

		let r = await execSafe(`${tscoverPath} --help`);

		assert(/^Version/.test(r.stdout));
		assert(/Syntax:\s*tsc \[options\] \[file ...\]/.test(r.stdout));
	});

	test('should cover individual files: project1_helloworld/helloworld.ts', async () => {
		await cover(path.join(projectsRoot, 'project1_helloworld/helloworld.ts'));

		let js = fs.readFileSync(path.join(projectFolder('project1_helloworld'), 'helloworld.js'), 'utf8');
		assert(/tscover/.test(js));
		assert(js.length > 1000);
	});

	test('should individual projects: project1_helloworld', async () => {
		await coverProject('project1_helloworld');

		let js = fs.readFileSync(path.join(projectFolder('project1_helloworld'), 'helloworld.js'), 'utf8');
		assert(/tscover/.test(js));
		assert(js.length > 1000);
	});

	test('should output coverage when run with --autosavecover', async () => {
		await coverProject('project1_helloworld');
		await execSafe(`node ${path.join(projectFolder('project1_helloworld'), 'helloworld.js')} --autosavecover`,
			{ cwd: projectFolder('project1_helloworld') });

		let lcovStr = fs.readFileSync(path.join(projectFolder('project1_helloworld/coverage'), 'lcov.info'), 'utf8');
		let coverStr = fs.readFileSync(path.join(projectFolder('project1_helloworld/coverage'), 'coverage.json'), 'utf8');
		let cover = JSON.parse(coverStr);

		assert(cover.totalLineCount === 1);
		assert(cover.totalLineCovered === 1);
		assert(cover.totalLineCoverage === 1);
		assert(cover.totalStatCount === 1);
		assert(cover.totalStatCovered === 1);
		assert(cover.totalStatCoverage === 1);
		assert(cover.files.length === 1);
		assert(cover.files[0].statementsCount === 1);
		assert(cover.files[0].statementsCovered === 1);
		assert(cover.files[0].statementsCoverage === 1);
	});

	test('should output correct coverage', async () => {
		await coverProject('project2_fizzbuzz');

		async function runFizzBuzz(max: number): Promise<any> {
			await execSafe(`node ${path.join(projectFolder('project2_fizzbuzz'), 'fizzbuzz.js')} --max ${max} --autosavecover`,
				{ cwd: projectFolder('project2_fizzbuzz') });
			let coverStr = fs.readFileSync(path.join(projectFolder('project2_fizzbuzz/coverage'), 'coverage.json'), 'utf8');
			let cover = JSON.parse(coverStr);

			return cover;
		}

		let cover1 = await runFizzBuzz(1);
		let cover3 = await runFizzBuzz(3);
		let cover5 = await runFizzBuzz(5);
		let cover15 = await runFizzBuzz(15);
		let cover100 = await runFizzBuzz(100);

		assert(cover1.totalStatCovered < cover3.totalStatCovered);
		assert(cover3.totalStatCovered < cover5.totalStatCovered);
		assert(cover5.totalStatCovered < cover15.totalStatCovered);
		assert(cover15.totalStatCovered === cover100.totalStatCovered);

		assert(cover1.totalLineCovered < cover3.totalLineCovered);
		assert(cover3.totalLineCovered < cover5.totalLineCovered);
		assert(cover5.totalLineCovered < cover15.totalLineCovered);
		assert(cover15.totalLineCovered === cover100.totalLineCovered);

		assert(cover1.totalBranchCovered < cover3.totalBranchCovered);
		assert(cover3.totalBranchCovered < cover5.totalBranchCovered);
		assert(cover5.totalBranchCovered < cover15.totalBranchCovered);
		assert(cover15.totalBranchCovered === cover100.totalBranchCovered);

		assert(cover15.totalStatCoverage === 1);
		assert(cover15.totalLineCoverage === 1);
		assert(cover15.totalBranchCoverage === 1);
	});

	test('should work with all keywords', async () => {
		await coverProject('project3_keywords');

		await execSafe(`node ${path.join(projectFolder('project3_keywords'), 'keywords.js')} --autosavecover`,
			{ cwd: projectFolder('project3_keywords') });
		let coverStr = fs.readFileSync(path.join(projectFolder('project3_keywords/coverage'), 'coverage.json'), 'utf8');
		let cover = JSON.parse(coverStr);

		assert(cover.totalLineCoverage === 1);
		assert(cover.totalStatCoverage === 1);
		assert(cover.totalBranchCoverage === 1);
	});

	test('should work with noImplicit options', async () => {
		await coverProject('project3_keywords', '--noImplicitAny --noImplicitReturns --noImplicitThis --noImplicitUseStrict');

		await execSafe(`node ${path.join(projectFolder('project3_keywords'), 'keywords.js')} --autosavecover`,
			{ cwd: projectFolder('project3_keywords') });
		let coverStr = fs.readFileSync(path.join(projectFolder('project3_keywords/coverage'), 'coverage.json'), 'utf8');
		let cover = JSON.parse(coverStr);

		assert(cover.totalLineCoverage === 1);
		assert(cover.totalStatCoverage === 1);
		assert(cover.totalBranchCoverage === 1);
	});

	test('should work with nested functions', async () => {
		await coverProject('project4_nested');

		await execSafe(`node ${path.join(projectFolder('project4_nested'), 'nested.js')} --autosavecover`,
			{ cwd: projectFolder('project4_nested') });
		let coverStr = fs.readFileSync(path.join(projectFolder('project4_nested/coverage'), 'coverage.json'), 'utf8');
		let cover = JSON.parse(coverStr);

		assert(cover.totalLineCoverage === 1);
		assert(cover.totalStatCoverage === 1);
	});

	test('should cover multiple files', async () => {
		await coverProject('project5_multifiles');

		async function runMultifiles(param: string): Promise<any> {
			await execSafe(`node ${path.join(projectFolder('project5_multifiles'), 'main.js')} --autosavecover ${param}`,
				{ cwd: projectFolder('project5_multifiles') });
			let coverStr = fs.readFileSync(path.join(projectFolder('project5_multifiles/coverage'), 'coverage.json'), 'utf8');
			let cover = JSON.parse(coverStr);

			return cover;
		}

		let cov = await runMultifiles('');
		let acov = await runMultifiles('-a');
		let bcov = await runMultifiles('-b');
		let ccov = await runMultifiles('-c');

		assert(cov.totalStatCount < ccov.totalStatCount);
		assert(ccov.totalStatCount < bcov.totalStatCount);
		assert(bcov.totalStatCount < acov.totalStatCount);

		assert(cov.files.length < ccov.files.length);
		assert(ccov.files.length < bcov.files.length);
		assert(bcov.files.length < acov.files.length);
	});

	// suite('subsuite...', function() {
	// 	test('should...', function() {
	// 	});
	// })

	// teardown(function() {
	// });

	// suiteTeardown(function() {
	// });
});
