
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

console.log(fileName + ' -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= ');

			// let fileObjName = 

			let statements = [];
			let instrumentedSource = vc3(source, [], 0, false, (type: string, node: typescript.Node) => {
				let fullStart = node.getFullStart() + node.getLeadingTriviaWidth();
				let length = node.getWidth() - node.getLeadingTriviaWidth();

				statements.push({ s: fullStart, l: length, c: 0 });

				return `${hash}.s[${statements.length - 1}].c++`;
			});

			let header = [];

			header.push(`let ${hash}: any = (Function('return this'))();`);
			header.push(`if (!${hash}.__coverage__) ${hash}.__coverage__ = {};`);
			header.push(`${hash} = ${hash}.__coverage__;`);
			header.push(`if (!${hash}.${hash}) ${hash}.${hash} = {};`);
			header.push(`${hash} = ${hash}.${hash};`);
			header.push(`if (!${hash}['${fileName}']) ${hash}['${fileName}'] = {`);
			header.push(`	s: ${JSON.stringify(statements)}`);
			header.push(`};`);
			header.push(`${hash} = ${hash}['${fileName}'];`);

			instrumentedSource = header.join('\n') + instrumentedSource;

console.log(instrumentedSource);

			return ts.createSourceFile(fileName, instrumentedSource, languageVersion);
		}

		return result;
	};

	program = createProgramOriginal.apply(ts, [fileNames, compilerOptions, compilerHost]);
	program.emit(undefined, (fileName, data, writeByteOrderMark, onError) => {});

	return program;
};

function vc3(node: typescript.Node,
	parents: typescript.Node[],
	depth: number,
	prefixed: boolean,
	report: (type: string, node: typescript.Node) => string)
{
	if (!node) return '';

	let parent = parents.length >= 1 ? parents[parents.length - 1] : { kind: null };
	let grandParent = parents.length >= 2 ? parents[parents.length - 2] : { kind: null };
	let grandGrandParent = parents.length >= 3 ? parents[parents.length - 3] : { kind: null };

// console.log(whitespace(depth * 2, ' ') + sk[node.kind] + ' ' + sk[parent.kind] + ' ' + sk[grandParent.kind]);

	let children = node.getChildren();
	let nodeText = node.getFullText();

	if (children.length === 0) return nodeText;

	parents.push(node);

	let p = [];

	for (let i = 0; i < children.length; i++) {
		let child = children[i];
		let prefixChild = false;

		if ((node.kind == sk.SyntaxList && (parent.kind == sk.SourceFile || parent.kind == sk.Block))
			// ||
			// (child.kind == sk.CallExpression && node.kind != sk.VariableDeclaration)
		) {
			prefixChild = true;
		}

		// let childVisit = vc3(child, parents, depth + 1, prefixChild || (prefixed && i == 0));

		let tw = node.getLeadingTriviaWidth();
		let childPrefix = '';
		let r = '';

		if (!prefixed && prefixChild) {

			if (child.kind == sk.IfStatement) {

				let ifStatement = child as typescript.IfStatement;
				let expVisit = vc3(ifStatement.expression, parents, depth + 1, false, report);
				let thenVisit = vc3(ifStatement.thenStatement, parents, depth + 1, false, report);
				let elseVisit = vc3(ifStatement.elseStatement, parents, depth + 1, false, report);

				r = `if (${expVisit}) { ${report('statement', child)}; ${thenVisit} } else { ${report('statement', child)}; ${elseVisit} }`;

			} else if (node.kind == sk.ArrowFunction && child.kind == sk.CallExpression) {

				let childVisit = vc3(child, parents, depth + 1, true, report);
				r = childVisit.substring(0, tw) +
					`{ return ${report('statement', child)}, ` +
					childVisit.substring(tw).replace(/^\s/, '') +
					'}';

			} else {

				let childVisit = vc3(child, parents, depth + 1, true, report);

				if (child.kind == sk.ExpressionStatement ||
					child.kind == sk.CallExpression
				) {
					childPrefix = `${report('statement', child)}, `;
				} else {
					childPrefix = `${report('statement', child)}; `;
				}

				// childPrefix += `/*${sk[node.kind]},${sk[child.kind]}*/`;

				r = childVisit.substring(0, tw) +
					childPrefix +
					childVisit.substring(tw);

			}

		} else {
			r = vc3(child, parents, depth + 1, prefixChild || (prefixed && i == 0), report);
		}

		p.push(r);
	}

	parents.pop();

	return p.join('');	
}

// function visitChildren(node: typescript.Node, depth: number): string {
// 	let children = node.getChildren();
// 	let nodeText = node.getFullText();

// 	if (children.length === 0) return nodeText;

// 	let p = [];
// 	for (let child of children) {
// 		let childVisit = visitNode(child, node, depth + 1);
// 		p.push(childVisit);
// 	}

// 	return p.join('');
// }

// function visitNode(node: typescript.Node, parent: typescript.Node, depth: number): string {
// 	let cc = '';
// 	let tw = node.getLeadingTriviaWidth();
// 	let start = node.getFullStart() + tw;
// 	let width = node.getFullWidth() - tw;

// 	// let path = this.treeVisitor.relPath;

// 	// console.log(whitespace(depth * 2, ' ') + depth + '  ' + node.getChildCount() + ' ' + sk[node.kind]);
// 	console.log(whitespace(depth * 2, ' ') + sk[node.kind]);

// 	switch (node.kind) {

// 		case sk.ClassDeclaration:
// 			cc = visitChildren(node, depth);
// 			return `${cc.substring(0, tw)}/*CLASS++*/${cc.substring(tw)}`;

// 		case sk.FunctionDeclaration:
// 			cc = visitChildren(node, depth);
// 			return `${cc.substring(0, tw)}/*FUNC++*/${cc.substring(tw)}`;

// 		case sk.IfStatement:
// 			// cc = visitChildren(node, depth);
// 			// return `${cc.substring(0, tw)}/*if++*/${cc.substring(tw)}`;

// 			let ifStatement = node as typescript.IfStatement;
// 			cc = node.getFullText();

// 			return `${cc.substring(0, tw)}if (${visitNode(ifStatement.expression, node, depth)}) ` + 
// 				`{/*THEN++;*/ ${visitNode(ifStatement.thenStatement, node, depth)} } ` +
// 				`else {/*ELSE++;*/ ${visitNode(ifStatement.elseStatement, node, depth)} }`;

// 			// case typescript.SyntaxKind.ForOfStatement:
// 			// 	let s = this.node as typescript.ForOfStatement;
// 			// 	cc = this.visitChildren();
// 			// 	this.treeVisitor.reportLocation(start, width);
// 			// 	return `${cc.substring(0, tw)}__coverage__.C('${path}', ${start}, ${width});${this.ntChildCode()}`;

// 		case sk.CallExpression:

// 			cc = visitChildren(node, depth);
// 			//let locInc = this.treeVisitor.reportStatement(start, width);
// 			// return `${cc.substring(0, tw)}(${123}, ${cc.substring(tw)})`;
// 			return `${cc.substring(0, tw)}/*CALL++*/${cc.substring(tw)}`;

// 		// case typescript.SyntaxKind.BinaryExpression:
// 		// 	this.treeVisitor.reportLocation(start, width);
// 		// 	return `__coverage__.C('${path}', ${start}, ${width}, ${this.visitChildren()})`;

// 		// case sk.FirstAssignment:
// 		// 	// let binaryExpression = node as typescript.;
// 		// 	// console.log(binaryExpression); 
// 		// 	cc = visitChildren(node, depth);
// 		// 	return `${cc.substring(0, tw)}/*ASSIGN++*/${cc.substring(tw)}`;

// 		// case sk.BinaryExpression:
// 		// 	let binaryExpression = node as typescript.BinaryExpression;
// 		// 	// console.log('----------');
// 		// 	// console.log(binaryExpression.getFullText());
// 		// 	// console.log(sk[binaryExpression.operatorToken.kind]);

// 		// 	if (binaryExpression.operatorToken.kind == sk.FirstAssignment ||
// 		// 		binaryExpression.operatorToken.kind == sk.FirstCompoundAssignment) {
// 		// 		// if (binaryExpression.) 
// 		// 		cc = visitChildren(node, depth);
// 		// 		return `${cc.substring(0, tw)}/*EXPRESS++*/${cc.substring(tw)}`;
// 		// 	}

// 		case sk.LetKeyword:
// 			cc = visitChildren(node, depth);
// 			return `${cc.substring(0, tw)}/*VAR++*/${cc.substring(tw)}`;

// 		default: //return visitChildren(node, depth);
// 			return visitChildren(node, depth);
// 	}
// }

// function visitSource(source: typescript.SourceFile): string {
// 	// let r = visitChildren(source, 0);
// 	let r = visitNode2(source, null);
// 	console.log(r);
// 	return r;
// }

// function vc(...args: any[]) {

// }

// function v(node: typescript.Node, parent: typescript.Node) {
// 	vc(node, parent, {
// 		'SourceFile': (n, p) => vc(n, {
// 			'SyntaxList': (s, p) => vc(s, {}, '')
// 		})
// 	});
// }

// function visitNode2(node: typescript.Node, parent: typescript.Node, depth: number = 0): string {
// 	let r = '';

// 	r += visitChildren2(node, depth, [
// 		{
// 			kind: sk.SourceFile,
// 			func: (n, p, d) => {
// 				// let s = [];
// 				// for (let child of n.getChildren()) {
// 				// 	s.push(child);
// 				// } 
// 				// return s.join('');
// 				return visitNode2(n, p, d);
// 			}
// 		}
// 	]);

// 	return r;
// }

// function visitChildren2(node: typescript.Node, depth: number, mapFns: { kind: number, func: (n: typescript.Node, p: typescript.Node, depth: number) => string }[]): string {
// 	let children = node.getChildren();
// 	let nodeText = node.getFullText();

// 	if (children.length === 0) return nodeText;

// 	let p = [];
// 	for (let child of children) {
// 		let fn = null;
// 		for (let mapFn of mapFns) {
// 			if (child.kind == mapFn.kind) fn = mapFn;
// 		}

// 		let childVisit = fn ? fn.func(child, node, depth + 1) : visitNode2(child, node, depth + 1);
// 		p.push(childVisit);
// 	}

// 	return p.join('');
// }


ts.executeCommandLine(ts.sys.args);

