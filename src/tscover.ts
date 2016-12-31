
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';
import * as crypto from 'crypto';
import * as typescript from 'typescript';

let typescriptPath: string = require.resolve('typescript');
let typescriptRoot: string = path.dirname(typescriptPath);
let tscPath: string = path.join(typescriptRoot, 'tsc.js');
let tscCode: string = fs.readFileSync(tscPath, 'utf8');
tscCode = tscCode.replace(/ts.executeCommandLine\(ts\.sys\.args\)\;/, '// ts.executeCommandLine(ts.sys.args);');
tscCode = '(function(require, __filename) { ' + tscCode + ' ;return ts; })';

let sk = vm.runInThisContext('(function(typescript) { return typescript.SyntaxKind })')(typescript);

let ts = vm.runInThisContext(tscCode, { displayErrors: true })(require, tscPath);
let createProgramOriginal = ts.createProgram;

function whitespace(length: number, ch: string = ' ') {
	let s = [];
	for (let i = 0; i < length; i++) s.push(ch);

	return s.join('');
}

function calculateHash(sources: typescript.SourceFile[]): string {
	let hash = crypto.createHash('md5');

	for (let source of sources) {
		hash.update(source.getFullText());
	}

	return '__' + hash.digest("hex").substring(0, 8) + '__';
}

ts.createProgram = function(fileNames, compilerOptions, compilerHost): typescript.Program {
	let program: typescript.Program;

	program = typescript.createProgram(fileNames, compilerOptions, /*, compilerHost*/);
	program.emit(undefined, (fileName, data, writeByteOrderMark, onError) => {});

	let sources = program.getSourceFiles();
	let hash = calculateHash(program.getSourceFiles());
	let covObjName = `__cov_${hash}_`;

	let getSourceFileOriginal = compilerHost.getSourceFile;

	compilerHost.getSourceFile = function(fileName, languageVersion, onError) {
		let result: typescript.SourceFile = getSourceFileOriginal.apply(compilerHost, [fileName, languageVersion, onError]);
		let source = sources.filter(s => s.fileName == fileName)[0];

		if (fileName.match(/\.ts$/) && !fileName.match(/\.d\.ts$/) && source) {

console.log(fileName + ' -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=  ');

			// let fileObjName = 

			let statements = [];
			let branches = [];
			let instrumentedSource = vn(source, { kind: null }, { kind: null }, 0, 0, false,
				(node: typescript.Node) => {
					let fullStart = node.getFullStart() + node.getLeadingTriviaWidth();
					let pos = node.getSourceFile().getLineAndCharacterOfPosition(fullStart);

					statements.push({ s: fullStart, l: pos.line, c: 0 });

					return `${hash}.s[${statements.length - 1}].c++`;
				},
				(node: typescript.Node) => {
					let fullStart = node.getFullStart() + node.getLeadingTriviaWidth();
					let pos = node.getSourceFile().getLineAndCharacterOfPosition(fullStart);
					branches.push({ s: fullStart, l: pos.line, c: [0, 0] });

					return `${hash}.b[${branches.length - 1}].c`;
				});

			let header = fs.readFileSync('header.ts', 'utf8')
				.split('// ---split---')[1]
				.replace(/__hash__/ig, hash)
				.replace(/__filename__/ig, fileName)
				.replace(/__statements__/ig, JSON.stringify(statements))
				.replace(/__branches__/ig, JSON.stringify(branches));

			instrumentedSource = header + instrumentedSource;

console.log(instrumentedSource);

			return ts.createSourceFile(fileName, instrumentedSource, languageVersion);
		}

		return result;
	};

	program = createProgramOriginal.apply(ts, [fileNames, compilerOptions, compilerHost]);
	program.emit(undefined, (fileName, data, writeByteOrderMark, onError) => {});

	return program;
};

function vn(node: typescript.Node,
	parent: typescript.Node | { kind: any },
	grandParent: typescript.Node | { kind: any },
	depth: number,
	index: number,
	prefixed: boolean,
	reportStatement: (node: typescript.Node) => string,
	reportBranch: (node: typescript.Node) => string): string
{
	if (!node) return '';

	let children = node.getChildren();
	let nodeText = node.getFullText();
	let trivia = node.getFullText().substring(0, node.getLeadingTriviaWidth());
	let nodePrefix = '';
	let childVisit = '';

	if (children.length === 0) return nodeText;

	if (!prefixed && parent.kind === sk.SyntaxList && (grandParent.kind === sk.SourceFile || grandParent.kind === sk.Block)) {
		nodePrefix = reportStatement(node) + ((node.kind == sk.ExpressionStatement || node.kind == sk.CallExpression) ? ', ' : '; ');
	}

	if (node.kind === sk.IfStatement) {

		let ifStatement = node as typescript.IfStatement;
		let expVisit = vn(ifStatement.expression, ifStatement, parent, depth + 1, 0, false, reportStatement, reportBranch);
		let thenVisit = vn(ifStatement.thenStatement, ifStatement, parent, depth + 1, 0, false, reportStatement, reportBranch);
		let elseVisit = vn(ifStatement.elseStatement, ifStatement, parent, depth + 1, 0, false, reportStatement, reportBranch);

		let branch = reportBranch(ifStatement);
		childVisit = trivia + `if (${expVisit}) { ${branch}[0]++; ${thenVisit} } else { ${branch}[1]++; ${elseVisit} } `;

	} else {

		let p = [];
		for (let i = 0; i < children.length; i++) {
			p.push(vn(children[i], node, parent, depth + 1, i, false, reportStatement, reportBranch));
		}

		childVisit = p.join('');

	}

	return trivia + nodePrefix + childVisit.substring(trivia.length);
}

ts.executeCommandLine(ts.sys.args);

