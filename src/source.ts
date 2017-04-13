
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
	 * Recoursively visits all node of a gived source node and produce instrumented version.
	 */
	visit() {
		this.statements = [];
		this.branches = [];

		this.instrumentedSource = this.visitNode(this.source, { kind: null }, { kind: null }, 0, 0, false);

		// prepend header to instrumented source
		let header = fs.readFileSync(path.join(__dirname, 'header.ts'), 'utf8')
			.split('// ---split---')[1]
			.replace(/__projectHash__/g, this.project.hash)
			.replace(/__fileHash__/g, this.hash)
			.replace(/__filename__/g, this.fileName)
			.replace(/__statements__/g, JSON.stringify(this.statements))
			.replace(/__branches__/g, JSON.stringify(this.branches))
			.replace(/__sourceCode__/g, JSON.stringify(this.source.getFullText()));

		this.instrumentedSource = header + this.instrumentedSource;

		// fs.writeFileSync(this.fileName + '.covered', this.instrumentedSource);
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
		depth: number,
		index: number,
		prefixed: boolean): string
	{
		if (!node) return '';

		let children = node.getChildren();
		let nodeText = node.getFullText();
		let trivia = node.getFullText().substring(0, node.getLeadingTriviaWidth());
		let nodePrefix = '';
		let childVisit = '';

		if (children.length === 0) return nodeText;

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
			let expVisit = this.visitNode(ifStatement.expression, ifStatement, parent, depth + 1, 0, false);
			let thenVisit = this.visitNode(ifStatement.thenStatement, ifStatement, parent, depth + 1, 0, false);
			let elseVisit = this.visitNode(ifStatement.elseStatement, ifStatement, parent, depth + 1, 0, false);

			let branch = this.reportBranch(ifStatement);
			childVisit = trivia + `if (${expVisit}) { ${branch}[0]++; ${thenVisit} } else { ${branch}[1]++; ${elseVisit} } `;
		} else {
			let p = [];
			for (let i = 0; i < children.length; i++) {
				p.push(this.visitNode(children[i], node, parent, depth + 1, i, false));
			}

			childVisit = p.join('');
		}

		return trivia + nodePrefix + childVisit.substring(trivia.length);
	}
}
