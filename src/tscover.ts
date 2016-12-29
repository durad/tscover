
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
			let branches = [];
			let instrumentedSource = vc3(source, [], 0, false,
				(node: typescript.Node) => {
					let fullStart = node.getFullStart() + node.getLeadingTriviaWidth();
					let length = node.getFullWidth() - node.getLeadingTriviaWidth();

					statements.push({ s: fullStart, l: length, c: 0 });

					return `${hash}.s[${statements.length - 1}].c++`;
				},
				(node: typescript.Node) => {
					let fullStart = node.getFullStart() + node.getLeadingTriviaWidth();
					branches.push({ s: fullStart, c: [0, 0] });

					return `${hash}.b[${branches.length - 1}].c`;
				});

			let header = [
				`let ${hash}: any = (Function('return this'))();`,
				`if (!${hash}.__coverage__) ${hash}.__coverage__ = {};`,
				`${hash} = ${hash}.__coverage__;`,
				`if (!${hash}.${hash}) ${hash}.${hash} = {};`,
				`${hash} = ${hash}.${hash};`,
				`if (!${hash}['${fileName}']) ${hash}['${fileName}'] = {`,
				`	s: ${JSON.stringify(statements)},`,
				`	b: ${JSON.stringify(branches)}`,
				`};`,
				`${hash} = ${hash}['${fileName}'];`,
				``
			];

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
	reportStatement: (node: typescript.Node) => string,
	reportBranch: (node: typescript.Node) => string)
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

	if (node.kind === sk.IfStatement) {

		let ifStatement = node as typescript.IfStatement;
		let expVisit = vc3(ifStatement.expression, parents, depth + 1, false, reportStatement, reportBranch);
		let thenVisit = vc3(ifStatement.thenStatement, parents, depth + 1, false, reportStatement, reportBranch);
		let elseVisit = vc3(ifStatement.elseStatement, parents, depth + 1, false, reportStatement, reportBranch);

		let branch = reportBranch(ifStatement);

		let r = node.getFullText().substring(0, node.getLeadingTriviaWidth()) + `if (${expVisit}) { ${branch}[0]++; ${thenVisit} } else { ${branch}[1]++; ${elseVisit} } `;
		p.push(r);

	} else {

		for (let i = 0; i < children.length; i++) {
			let child = children[i];
			let prefixChild = false;

			if ((node.kind == sk.SyntaxList && (parent.kind == sk.SourceFile || parent.kind == sk.Block))
				// ||
				// (child.kind == sk.CallExpression && node.kind != sk.VariableDeclaration)
			) {
				prefixChild = true;
			}

			let tw = node.getLeadingTriviaWidth();
			let childPrefix = '';
			let r = '';

			if (!prefixed && prefixChild) {

				if (node.kind == sk.ArrowFunction && child.kind == sk.CallExpression) {

					let childVisit = vc3(child, parents, depth + 1, true, reportStatement, reportBranch);
					r = childVisit.substring(0, tw) +
						`{ return ${reportStatement(child)}, ` +
						childVisit.substring(tw).replace(/^\s/, '') +
						'}';

				} else {

					let childVisit = vc3(child, parents, depth + 1, true, reportStatement, reportBranch);

					if (child.kind == sk.ExpressionStatement ||
						child.kind == sk.CallExpression
					) {
						childPrefix = `${reportStatement(child)}, `;
					} else {
						childPrefix = `${reportStatement(child)}; `;
					}

					// childPrefix += `/*${sk[node.kind]},${sk[child.kind]}*/`;

					r = childVisit.substring(0, tw) +
						childPrefix +
						childVisit.substring(tw);

				}

			} else {
				r = vc3(child, parents, depth + 1, prefixChild || (prefixed && i == 0), reportStatement, reportBranch);
			}

			p.push(r);
		}
	}

	parents.pop();

	return p.join('');	
}

ts.executeCommandLine(ts.sys.args);

