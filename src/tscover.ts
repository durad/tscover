
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

let sk = vm.runInThisContext('(function(typescript) { return typescript.SyntaxKind })')(typescript);





class SourceVisitor {
	constructor(sourceFile: typescript.SourceFile) {

	}
}


function whitespace(length: number, ch: string = ' ') {
	let s = [];
	for (let i = 0; i < length; i++) s.push(ch);

	return s.join('');
}

class TreeVisitor {
	sourceFile: typescript.SourceFile;
	rootVisitor: NodeVisitor;
	relPath: string;
	statementCount: number = 0;

	coverage = {
		path: '',
		s: {},
		b: {},
		f: {},
		fnMap: {},
		statementMap: {},
		branchMap: {}
	};

	constructor(sourceFile: typescript.SourceFile, relPath: string) {
		this.sourceFile = sourceFile;
		this.coverage.path = this.sourceFile.fileName;
		this.rootVisitor = new NodeVisitor(this, this.sourceFile, null, 0);
		this.relPath = relPath;
	}

	visit(): string {
		return this.rootVisitor.visit();
	}

	reportStatement(start: number, length: number): string {
		let startPos = this.sourceFile.getLineAndCharacterOfPosition(start);
		let endPos = this.sourceFile.getLineAndCharacterOfPosition(start + length);

		this.statementCount++;

		this.coverage.statementMap[this.statementCount + ''] = {
			start: {
				line: startPos.line + 1,
				column: startPos.character
			},
			end: {
				line: endPos.line + 1,
				column: endPos.character
			}
		};

		this.coverage.s[this.statementCount + ''] = 0;

		return `__coverage__.s['${this.statementCount}']++`;
	}
}

class NodeVisitor {
	treeVisitor: TreeVisitor;
	node: typescript.Node;
	parent: typescript.Node;
	depth: number;
	children: typescript.Node[];
	isLeaf: boolean;
	syntaxKindName: string;
	whitespace: string;
	nodeText: string;
	childCode: string;

	constructor(treeVisitor, node: typescript.Node, parent: typescript.Node, depth: number = 0) {
		this.treeVisitor = treeVisitor;
		this.node = node;
		this.parent = parent;
		this.depth = depth;
		this.children = node.getChildren();
		this.isLeaf = this.children.length === 0;
		this.syntaxKindName = sk[this.node.kind];
		this.nodeText = this.node.getFullText();
		this.whitespace = whitespace(depth, ' ');
	}

	ntChildCode(): string {
		if (this.childCode === undefined) this.childCode = this.visitChildren();

		return this.childCode.substring(this.node.getLeadingTriviaWidth(), this.childCode.length);
	}

	visit(): string {

		let cc = '';
		let tw = this.node.getLeadingTriviaWidth();
		let start = this.node.getFullStart() + tw;
		let width = this.node.getFullWidth() - tw;

		let path = this.treeVisitor.relPath;

		switch (this.node.kind) {

			// case typescript.SyntaxKind.IfStatement:
			// 	let ifStatement = this.node as typescript.IfStatement;
			// 	cc = this.node.getFullText();

			// 	return `${cc.substring(0, tw)}if (${this.visitNode(ifStatement.expression)}) ` + 
			// 		`{ __coverage__.THEN; ${this.visitNode(ifStatement.thenStatement)} } ` +
			// 		`else { __coverage__.ELSE; ${this.visitNode(ifStatement.elseStatement)} }`;

			// case typescript.SyntaxKind.ForOfStatement:
			// 	let s = this.node as typescript.ForOfStatement;
			// 	cc = this.visitChildren();
			// 	this.treeVisitor.reportLocation(start, width);
			// 	return `${cc.substring(0, tw)}__coverage__.C('${path}', ${start}, ${width});${this.ntChildCode()}`;

			case sk.CallExpression:
				cc = this.visitChildren();
				let locInc = this.treeVisitor.reportStatement(start, width);
				return `${cc.substring(0, tw)}(${locInc}, ${this.ntChildCode()})`;

			// case typescript.SyntaxKind.BinaryExpression:
			// 	this.treeVisitor.reportLocation(start, width);
			// 	return `__coverage__.C('${path}', ${start}, ${width}, ${this.visitChildren()})`;

			default: return this.visitChildren();
		}
	}

	visitChildren(): string {
		if (this.isLeaf) return this.nodeText;

		let children = this.children;
		let p = [];
		for (let child of children) {
			let childVisit = new NodeVisitor(this.treeVisitor, child, this.node, this.depth + 1);
			let c = childVisit.visit();
			p.push(c);
		}

		return p.join('');
	}

	visitNode(node: typescript.Node): string {
		if (!node) return '';

		let nodeVisit = new NodeVisitor(this.treeVisitor, node, this.node, this.depth + 1);
		return nodeVisit.visit();
	}
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
			let t = new TreeVisitor(source, fileName);
			let instrumentedSource = t.visit();
			instrumentedSource = 'let __coverage__ : any={};\n\n' + instrumentedSource;
 
			return ts.createSourceFile(fileName, instrumentedSource, languageVersion);
		}

		return result;
	};

	program = createProgramOriginal.apply(ts, [fileNames, compilerOptions, compilerHost]);
	program.emit(undefined, (fileName, data, writeByteOrderMark, onError) => {});

	return program;
};

ts.executeCommandLine(ts.sys.args);



