
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';

let typescriptPath: string = require.resolve('typescript');
let typescriptRoot: string = path.dirname(typescriptPath);
let tscPath: string = path.join(typescriptRoot, 'tsc.js');
let tscCode:string = fs.readFileSync(tscPath, 'utf8');
tscCode = tscCode.replace(/ts.executeCommandLine\(ts\.sys\.args\)\;/, '// ts.executeCommandLine(ts.sys.args);');
tscCode = '(function(require, __filename) { ' + tscCode + ' ;return ts; })';

let ts = vm.runInThisContext(tscCode, { displayErrors: true })(require, tscPath);
let createProgramOriginal = ts.createProgram;

ts.createProgram = function(fileNames, compilerOptions, compilerHost) {
	let program = createProgramOriginal.apply(ts, [fileNames, compilerOptions, compilerHost]);
	return program;
};

ts.executeCommandLine(ts.sys.args);

