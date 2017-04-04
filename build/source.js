"use strict";
var fs = require("fs");
var path = require("path");
var SourceInstrumenter = (function () {
    /**
     * Constructs SourceInstrumenter instance
     * @param sk Runtime version of SyntaxKind
     * @param hash Hash of all source files being processed
     * @param fileName File name of the current source
     * @param source SourceFile node that we will instrument
     */
    function SourceInstrumenter(project, fileName, source) {
        this.sk = project.sk;
        this.hash = project.hash;
        this.fileName = fileName;
        this.source = source;
    }
    /**
     * Recoursively visits all node of a gived source node and produce instrumented version.
     */
    SourceInstrumenter.prototype.visit = function () {
        this.statements = [];
        this.branches = [];
        this.instrumentedSource = this.visitNode(this.source, { kind: null }, { kind: null }, 0, 0, false);
        // prepend header to instrumented source
        var header = fs.readFileSync(path.join(__dirname, 'header.ts'), 'utf8')
            .split('// ---split---')[1]
            .replace(/__hash__/ig, this.hash)
            .replace(/__filename__/ig, this.fileName)
            .replace(/__statements__/ig, JSON.stringify(this.statements))
            .replace(/__branches__/ig, JSON.stringify(this.branches));
        this.instrumentedSource = header + this.instrumentedSource;
    };
    /**
     * Called for every statement found in the source. Returns instrumentation statement prefix.
     * @param node Node element representing the statement node.
     */
    SourceInstrumenter.prototype.reportStatement = function (node) {
        // save statement and return instrumentation prefix
        var fullStart = node.getFullStart() + node.getLeadingTriviaWidth();
        var pos = node.getSourceFile().getLineAndCharacterOfPosition(fullStart);
        this.statements.push({ s: fullStart, l: pos.line, c: 0 });
        return this.hash + ".s[" + (this.statements.length - 1) + "].c++";
    };
    /**
     * Called for every statement found in the source. Returns instrumentation statement prefix.
     * @param node Node element representing the branch node.
     */
    SourceInstrumenter.prototype.reportBranch = function (node) {
        // save branch and return instrumentation prefix
        var fullStart = node.getFullStart() + node.getLeadingTriviaWidth();
        var pos = node.getSourceFile().getLineAndCharacterOfPosition(fullStart);
        this.branches.push({ s: fullStart, l: pos.line, c: [0, 0] });
        return this.hash + ".b[" + (this.branches.length - 1) + "].c";
    };
    /**
     * Recursively visit node and its children and return instrumented code.
     * @param node Root node for recursion
     * @param parent Parent of the node
     * @param grandParent Grandparent of the node
     * @param depth Depth of the recursion stack
     * @param index Node's index in parent's list of children
     * @param prefixed True if one of the parents has already been prefixed
     */
    SourceInstrumenter.prototype.visitNode = function (node, parent, grandParent, depth, index, prefixed) {
        if (!node)
            return '';
        var children = node.getChildren();
        var nodeText = node.getFullText();
        var trivia = node.getFullText().substring(0, node.getLeadingTriviaWidth());
        var nodePrefix = '';
        var childVisit = '';
        if (children.length === 0)
            return nodeText;
        // if super() is a first child do not prefix it
        var isFirstSuper = false;
        if (index === 0 &&
            node.kind === this.sk.ExpressionStatement &&
            children.length >= 1 &&
            children[0].kind === this.sk.CallExpression) {
            var callExprChild = children[0];
            if (callExprChild.getChildCount() >= 0 && callExprChild.getChildAt(0).kind === this.sk.SuperKeyword) {
                isFirstSuper = true;
            }
        }
        if (!prefixed &&
            parent.kind === this.sk.SyntaxList &&
            (grandParent.kind === this.sk.SourceFile || grandParent.kind === this.sk.Block) &&
            !isFirstSuper) {
            nodePrefix = this.reportStatement(node);
            nodePrefix += ((node.kind == this.sk.ExpressionStatement || node.kind == this.sk.CallExpression) ? ', ' : '; ');
        }
        if (node.kind === this.sk.IfStatement) {
            var ifStatement = node;
            var expVisit = this.visitNode(ifStatement.expression, ifStatement, parent, depth + 1, 0, false);
            var thenVisit = this.visitNode(ifStatement.thenStatement, ifStatement, parent, depth + 1, 0, false);
            var elseVisit = this.visitNode(ifStatement.elseStatement, ifStatement, parent, depth + 1, 0, false);
            var branch = this.reportBranch(ifStatement);
            childVisit = trivia + ("if (" + expVisit + ") { " + branch + "[0]++; " + thenVisit + " } else { " + branch + "[1]++; " + elseVisit + " } ");
        }
        else {
            var p = [];
            for (var i = 0; i < children.length; i++) {
                p.push(this.visitNode(children[i], node, parent, depth + 1, i, false));
            }
            childVisit = p.join('');
        }
        return trivia + nodePrefix + childVisit.substring(trivia.length);
    };
    return SourceInstrumenter;
}());
exports.SourceInstrumenter = SourceInstrumenter;
