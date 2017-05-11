
import * as fs from 'fs';
import * as path from 'path';
import * as typescript from 'typescript';
import { ProjectInstrumenter } from './project';
import { Util } from './util';

export class SourceInstrumenter {
	project: ProjectInstrumenter;
	sk: any;
	hash: string;
	fileName: string;
	source: typescript.SourceFile;
	instrumentedSource: string;
	statements: any[];
	branches: any[];
	instrument: boolean;

	/**
	 * Constructs SourceInstrumenter instance
	 * @param sk Runtime version of SyntaxKind
	 * @param hash Hash of all source files being processed
	 * @param fileName File name of the current source
	 * @param source SourceFile node that we will instrument
	 */
	constructor(project: ProjectInstrumenter, fileName: string, source: typescript.SourceFile) {
		this.project = project;
		this.sk = project.sk;
		this.hash = Util.calculateHash([source]);
		this.fileName = path.resolve(fileName);
		this.source = source;
	}

	/**
	 * Searches for a first occurance of term and replaces it with a given string
	 * @param original String to search term in
	 * @param term Term String that is being searched
	 * @param replacement Replacement term
	 */
	replace(original: string, term: string, replacement: string) {
		let index = original.indexOf(term);
		
		if (index < 0) {
			return original;
		} else {
			return original.substr(0, index) + replacement + original.substr(index + term.length);
		}
	}

	/**
	 * Recoursively visits all node of a gived source node and produce instrumented version.
	 */
	visit() {
		this.statements = [];
		this.branches = [];

		this.instrumentedSource = this.visitNode(this.source, { kind: null }, { kind: null }, [this.source], 0, 0, false);

		// prepend header to instrumented source
		let header = fs.readFileSync(path.join(__dirname, 'header.tmpl'), 'utf8')
			.replace(/__projectHash__/g, this.project.hash)
			.replace(/__fileHash__/g, this.hash)
			.replace(/__filename__/g, this.fileName)

		header = this.replace(header, '__statements__', JSON.stringify(this.statements));
		header = this.replace(header, '__branches__', JSON.stringify(this.branches));
		header = this.replace(header, '__sourceCode__', JSON.stringify(this.source.getFullText()));

		let instrumentedLines = this.instrumentedSource.split('\n');
		if (instrumentedLines.length > 0 && instrumentedLines[0].indexOf('#!') === 0) {
			this.instrumentedSource = [instrumentedLines[0]]
				.concat([header])
				.concat(instrumentedLines.slice(1))
				.join('\n');
		} else {
			this.instrumentedSource = header + this.instrumentedSource;
		}

		if (this.project.options.instrument) {
			fs.writeFileSync(this.fileName + '.cover', this.instrumentedSource);
		}
	}

	/**
	 * Called for every statement found in the source. Returns instrumentation statement prefix.
	 * @param node Node element representing the statement node.
	 */
	protected reportStatement(node: typescript.Node): string {
		// save statement and return instrumentation prefix
		let fullStart = node.getFullStart() + node.getLeadingTriviaWidth();
		let pos = node.getSourceFile().getLineAndCharacterOfPosition(fullStart);

		this.statements.push({ s: fullStart, l: pos.line, c: 0 });

		return `${this.hash}.s[${this.statements.length - 1}].c++`;
	}

	/**
	 * Called for every statement found in the source. Returns instrumentation statement prefix.
	 * @param node Node element representing the branch node.
	 */
	protected reportBranch(node: typescript.Node): string {
		// save branch and return instrumentation prefix
		let fullStart = node.getFullStart() + node.getLeadingTriviaWidth();
		let pos = node.getSourceFile().getLineAndCharacterOfPosition(fullStart);
		this.branches.push({ s: fullStart, l: pos.line, c: [0, 0] });

		return `${this.hash}.b[${this.branches.length - 1}].c`;
	}

	/**
	 * Recursively visit node and its children and return instrumented code.
	 * @param node Root node for recursion
	 * @param parent Parent of the node
	 * @param grandParent Grandparent of the node
	 * @param depth Depth of the recursion stack
	 * @param index Node's index in parent's list of children
	 * @param prefixed True if one of the parents has already been prefixed
	 */
	protected visitNode(node: typescript.Node,
		parent: typescript.Node | { kind: any },
		grandParent: typescript.Node | { kind: any },
		siblings: typescript.Node[],
		depth: number,
		index: number,
		prefixed: boolean): string
	{
		if (!node || node.kind === this.sk.FirstJSDocTagNode) {
			return '';
		}

		let children = node.getChildren();
		let nodeText = node.getFullText();

		if (children.length === 0 ||
			node.kind === this.sk.PropertySignature ||
			node.kind === this.sk.FirstJSDocTagNode
		) {
			return nodeText;
		}

		let trivia = node.getFullText().substring(0, node.getLeadingTriviaWidth());
		let nodePrefix = '';
		let childVisit = '';

		// if super() is a first child do not prefix it
		let isFirstSuper = false;
		if (
			index === 0 &&
			node.kind === this.sk.ExpressionStatement &&
			children.length >= 1 &&
			children[0].kind === this.sk.CallExpression
		) {
			let callExprChild = children[0] as typescript.CallExpression;
			if (callExprChild.getChildCount() >= 0 && callExprChild.getChildAt(0).kind === this.sk.SuperKeyword) {
				isFirstSuper = true;
			}
		}

		if (node.kind === this.sk.FunctionDeclaration &&
			index !== 0 &&
			siblings[index - 1].kind === this.sk.FunctionDeclaration &&
			siblings[index - 1].getChildren()[siblings[index - 1].getChildCount() - 1].kind !== this.sk.Block
		) {
			prefixed = true;
		}

		if (!prefixed &&
			parent.kind === this.sk.SyntaxList &&
			(grandParent.kind === this.sk.SourceFile || grandParent.kind === this.sk.Block) &&
			!isFirstSuper
		) {
			nodePrefix = this.reportStatement(node);
			nodePrefix += ((node.kind == this.sk.ExpressionStatement || node.kind == this.sk.CallExpression) ? ', ' : '; ');
		}

		if (node.kind === this.sk.IfStatement) {
			let ifStatement = node as typescript.IfStatement;
			let expVisit = this.visitNode(ifStatement.expression, ifStatement, parent, [ifStatement.expression], depth + 1, 0, false);
			let thenVisit = this.visitNode(ifStatement.thenStatement, ifStatement, parent, [ifStatement.thenStatement], depth + 1, 0, false);
			let elseVisit = this.visitNode(ifStatement.elseStatement, ifStatement, parent, [ifStatement.elseStatement], depth + 1, 0, false);

			let branch = this.reportBranch(ifStatement);
			childVisit = trivia + `if (${expVisit}) { ${branch}[0]++; ${thenVisit} } else { ${branch}[1]++; ${elseVisit} } `;
		} else {
			let p = [];
			for (let i = 0; i < children.length; i++) {
				p.push(this.visitNode(children[i], node, parent, children, depth + 1, i, prefixed && i === 0));
			}

			childVisit = p.join('');
		}

		return trivia + nodePrefix + childVisit.substring(trivia.length);
	}
}
