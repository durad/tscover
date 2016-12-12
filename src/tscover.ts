
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

let sk = vm.runInThisContext('(function(typescript) { return typescript.SyntaxKind })')(typescript);

let ts = vm.runInThisContext(tscCode, { displayErrors: true })(require, tscPath);
let createProgramOriginal = ts.createProgram;




class SourceVisitor {
	constructor(sourceFile: typescript.SourceFile) {

	}
}


function whitespace(length: number, ch: string = ' ') {
	let s = [];
	for (let i = 0; i < length; i++) s.push(ch);

	return s.join('');
}


ts.createProgram = function(fileNames, compilerOptions, compilerHost): typescript.Program {
	let program: typescript.Program;

	program = typescript.createProgram(fileNames, compilerOptions, /*, compilerHost*/);
	program.emit(undefined, (fileName, data, writeByteOrderMark, onError) => {});

	let sources = program.getSourceFiles();
	let source = sources.filter(s => s.fileName.match(/main\.ts/))[0];

	let getSourceFileOriginal = compilerHost.getSourceFile;

	compilerHost.getSourceFile = function(fileName, languageVersion, onError) {
		let result: typescript.SourceFile = getSourceFileOriginal.apply(compilerHost, [fileName, languageVersion, onError]);
		let source = sources.filter(s => s.fileName == fileName)[0];

		if (fileName.match(/\.ts$/) && !fileName.match(/\.d\.ts$/) && source) {

			console.log(fileName);
			// let t = new TreeVisitor(source, fileName);
			// let instrumentedSource = t.visit();
			// instrumentedSource = 'let __coverage__ : any={};\n\n' + instrumentedSource;

			let instrumentedSource = visitSource(source);
 
			return ts.createSourceFile(fileName, instrumentedSource, languageVersion);
		}

		return result;
	};

	program = createProgramOriginal.apply(ts, [fileNames, compilerOptions, compilerHost]);
	program.emit(undefined, (fileName, data, writeByteOrderMark, onError) => {});

	return program;
};


function visitChildren(node: typescript.Node, depth: number): string {
	let children = node.getChildren();
	let nodeText = node.getFullText();

	if (children.length === 0) return nodeText;

	let p = [];
	for (let child of children) {
		let childVisit = visitNode(child, node, depth + 1);
		p.push(childVisit);
	}

	return p.join('');
}

function visitNode(node: typescript.Node, parent: typescript.Node, depth: number): string {
	let cc = '';
	let tw = node.getLeadingTriviaWidth();
	let start = node.getFullStart() + tw;
	let width = node.getFullWidth() - tw;

	// let path = this.treeVisitor.relPath;

	// console.log(whitespace(depth * 2, ' ') + depth + '  ' + node.getChildCount() + ' ' + sk[node.kind]);
	console.log(whitespace(depth * 2, ' ') + sk[node.kind]);

	switch (node.kind) {

		case sk.ClassDeclaration:
			cc = visitChildren(node, depth);
			return `${cc.substring(0, tw)}/*CLASS++*/${cc.substring(tw)}`;

		case sk.FunctionDeclaration:
			cc = visitChildren(node, depth);
			return `${cc.substring(0, tw)}/*FUNC++*/${cc.substring(tw)}`;

		case sk.IfStatement:
			// cc = visitChildren(node, depth);
			// return `${cc.substring(0, tw)}/*if++*/${cc.substring(tw)}`;

			let ifStatement = node as typescript.IfStatement;
			cc = node.getFullText();

			return `${cc.substring(0, tw)}if (${visitNode(ifStatement.expression, node, depth)}) ` + 
				`{/*THEN++;*/ ${visitNode(ifStatement.thenStatement, node, depth)} } ` +
				`else {/*ELSE++;*/ ${visitNode(ifStatement.elseStatement, node, depth)} }`;

			// case typescript.SyntaxKind.ForOfStatement:
			// 	let s = this.node as typescript.ForOfStatement;
			// 	cc = this.visitChildren();
			// 	this.treeVisitor.reportLocation(start, width);
			// 	return `${cc.substring(0, tw)}__coverage__.C('${path}', ${start}, ${width});${this.ntChildCode()}`;

		case sk.CallExpression:

			cc = visitChildren(node, depth);
			//let locInc = this.treeVisitor.reportStatement(start, width);
			// return `${cc.substring(0, tw)}(${123}, ${cc.substring(tw)})`;
			return `${cc.substring(0, tw)}/*CALL++*/${cc.substring(tw)}`;

		// case typescript.SyntaxKind.BinaryExpression:
		// 	this.treeVisitor.reportLocation(start, width);
		// 	return `__coverage__.C('${path}', ${start}, ${width}, ${this.visitChildren()})`;

		// case sk.FirstAssignment:
		// 	// let binaryExpression = node as typescript.;
		// 	// console.log(binaryExpression); 
		// 	cc = visitChildren(node, depth);
		// 	return `${cc.substring(0, tw)}/*ASSIGN++*/${cc.substring(tw)}`;

		// case sk.BinaryExpression:
		// 	let binaryExpression = node as typescript.BinaryExpression;
		// 	// console.log('----------');
		// 	// console.log(binaryExpression.getFullText());
		// 	// console.log(sk[binaryExpression.operatorToken.kind]);

		// 	if (binaryExpression.operatorToken.kind == sk.FirstAssignment ||
		// 		binaryExpression.operatorToken.kind == sk.FirstCompoundAssignment) {
		// 		// if (binaryExpression.) 
		// 		cc = visitChildren(node, depth);
		// 		return `${cc.substring(0, tw)}/*EXPRESS++*/${cc.substring(tw)}`;
		// 	}

		case sk.LetKeyword:
			cc = visitChildren(node, depth);
			return `${cc.substring(0, tw)}/*VAR++*/${cc.substring(tw)}`;

		default: //return visitChildren(node, depth);
			return visitChildren(node, depth);
	}
}

function visitSource(source: typescript.SourceFile): string {
	let r = visitChildren(source, 0);
	console.log(r);
	return r;
}

ts.executeCommandLine(ts.sys.args);

