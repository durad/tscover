
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';
import * as crypto from 'crypto';
import * as typescript from 'typescript';
import { Util } from './util';
import { SourceInstrumenter } from './source';


export class ProjectInstrumenter {
	sk: any;
	hash: string;
	options = {
		instrument: false
	};

	/**
	 * Main entry point into compilation process
	 */
	run() {
		// TODO: commander
		let instrumentIndex = process.argv.indexOf('--tscover-instrument');
		if (instrumentIndex !== -1) {
			this.options.instrument = true;
			process.argv.splice(instrumentIndex, 1);
		}

		// capture installed TypesScript compiler and its createProgram func
		let globalModulesPath = require('global-modules');
		let typescriptRoot: string = path.join(globalModulesPath, 'typescript');
		let typescriptResolved: string = require.resolve(typescriptRoot);
		let tscRoot: string = path.dirname(typescriptResolved);
		let typescript: any = require(typescriptResolved);
		let tscPath: string = path.join(tscRoot, 'tsc.js');
		let tscCode: string = fs.readFileSync(tscPath, 'utf8');
		tscCode = tscCode.replace(/ts.executeCommandLine\(ts\.sys\.args\)\;/, '// ts.executeCommandLine(ts.sys.args);');
		tscCode = '(function(require, __filename) { ' + tscCode + ' ;return ts; })';
		let ts = vm.runInThisContext(tscCode, { displayErrors: true })(require, tscPath);
		let createProgramOriginal = ts.createProgram;

		// capture runtime SyntaxKind values
		this.sk = vm.runInThisContext('(function(typescript) { return typescript.SyntaxKind })')(typescript);

		// hijack createProgram - main entry point into compilation process
		ts.createProgram = (fileNames, compilerOptions, compilerHost): typescript.Program => {
			let program: typescript.Program;

			// call createProgram() and emit() with empty writer to trigger parsing of source files
			program = typescript.createProgram(fileNames, compilerOptions);
			program.emit(undefined, (fileName, data, writeByteOrderMark, onError) => {});

			let sources = program.getSourceFiles();
			this.hash = Util.calculateHash(program.getSourceFiles());

			// getSourceFile gets syntax tree of the source file. We are hijacking this to insert instrumentaion logic
			let getSourceFileOriginal = compilerHost.getSourceFile;
			compilerHost.getSourceFile = (fileName, languageVersion, onError) => {
				let result: typescript.SourceFile = getSourceFileOriginal.apply(compilerHost, [fileName, languageVersion, onError]);
				let source = sources.filter(s => s.fileName == fileName)[0];

				if (fileName.match(/\.ts$/) && !fileName.match(/\.d\.ts$/) && source) {
					let instrumenter = new SourceInstrumenter(this, fileName, source);
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
	}
}
