
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';
import * as crypto from 'crypto';
import * as typescript from 'typescript';
import { SourceInstrumenter } from './sourceinstrumenter';

// capture installed TypesScript compiler and its createProgram func
let typescriptPath: string = require.resolve('typescript');
let typescriptRoot: string = path.dirname(typescriptPath);
let tscPath: string = path.join(typescriptRoot, 'tsc.js');
let tscCode: string = fs.readFileSync(tscPath, 'utf8');
tscCode = tscCode.replace(/ts.executeCommandLine\(ts\.sys\.args\)\;/, '// ts.executeCommandLine(ts.sys.args);');
tscCode = '(function(require, __filename) { ' + tscCode + ' ;return ts; })';
let ts = vm.runInThisContext(tscCode, { displayErrors: true })(require, tscPath);
let createProgramOriginal = ts.createProgram;

// capture runtime SyntaxKind values
let sk = vm.runInThisContext('(function(typescript) { return typescript.SyntaxKind })')(typescript);

function calculateHash(sources: typescript.SourceFile[]): string {
	let hash = crypto.createHash('md5');

	for (let source of sources) {
		hash.update(source.getFullText());
	}

	return '__' + hash.digest("hex").substring(0, 8) + '__';
}

// hijack createProgram - main entry point into compilation process
ts.createProgram = function(fileNames, compilerOptions, compilerHost): typescript.Program {
	let program: typescript.Program;

	// call createProgram() and emit() with empty writer to trigger parsing of source files
	program = typescript.createProgram(fileNames, compilerOptions);
	program.emit(undefined, (fileName, data, writeByteOrderMark, onError) => {});

	let sources = program.getSourceFiles();
	let hash = calculateHash(program.getSourceFiles());
	let covObjName = `__cov_${hash}_`;

	// getSourceFile gets syntax tree of the source file. We are hijacking this to insert instrumentaion logic
	let getSourceFileOriginal = compilerHost.getSourceFile;
	compilerHost.getSourceFile = function(fileName, languageVersion, onError) {
		let result: typescript.SourceFile = getSourceFileOriginal.apply(compilerHost, [fileName, languageVersion, onError]);
		let source = sources.filter(s => s.fileName == fileName)[0];

		if (fileName.match(/\.ts$/) && !fileName.match(/\.d\.ts$/) && source) {

			let instrumenter = new SourceInstrumenter(sk, hash, fileName, source);
			instrumenter.visit();

			return ts.createSourceFile(fileName, instrumenter.instrumentedSource, languageVersion);
		}

		return result;
	};

	// call original createProgram() and emit() to trigger the whole process
	program = createProgramOriginal.apply(ts, [fileNames, compilerOptions, compilerHost]);
	program.emit(undefined, (fileName, data, writeByteOrderMark, onError) => {});

	return program;
};

ts.executeCommandLine(ts.sys.args);

