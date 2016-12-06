
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';
import * as typescript from 'typescript';

let typescriptPath: string = require.resolve('typescript');
let typescriptRoot: string = path.dirname(typescriptPath);
let tscPath: string = path.join(typescriptRoot, 'tsc.js');
let tscCode: string = fs.readFileSync(tscPath, 'utf8');
tscCode = tscCode.replace(/ts.executeCommandLine\(ts\.sys\.args\)\;/, '// ts.executeCommandLine(ts.sys.args);');
tscCode = '(function(require, __filename) { ' + tscCode + ' ;return ts; })';

let ts = vm.runInThisContext(tscCode, { displayErrors: true })(require, tscPath);
let createProgramOriginal = ts.createProgram;

ts.createProgram = function(fileNames, compilerOptions, compilerHost): typescript.Program {
	// compilerOptions = { noEmitOnError: true, noImplicitAny: true, target: typescript.ScriptTarget.ES6, module: typescript.ModuleKind.CommonJS };
	// let program: typescript.Program = createProgramOriginal.apply(ts, [fileNames, compilerOptions, compilerHost]);
	let program: typescript.Program = typescript.createProgram(fileNames, compilerOptions/*, compilerHost*/);
	program.emit(undefined,
		(fileName: string, data: string, writeByteOrderMark: boolean, onError?: (message: string) => void) => {}
	);

	let sources = program.getSourceFiles();

	for (let source of sources.filter(s => s.fileName.indexOf('.d.ts') < 0)) {
		console.log(source.fileName);

		console.log(source.statements.length);
		let statementLength = source.statements.length;

		visit(source, source);
	}

	return program;
};

function visit(source: typescript.SourceFile, node: typescript.Node, depth = 0) {
	let children = node.getChildren();
	for (let child of children) {
		visit(source, child, depth + 1);
	}
}

ts.executeCommandLine(ts.sys.args);

